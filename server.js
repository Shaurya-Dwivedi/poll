let globalLogout = false;


let logoutAll = false;

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// CORS configuration - allow all origins for now (you can restrict later)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;


// ✅ Student DB
const students = {
  "DDDDDD": { rollNo: "B24CH1038", name: "Shaurya Dwivedi" },
  "BBBBBB": { rollNo: "B24CI1048", name: "Samruddha Jadhav" },
  "AAAAAA": { rollNo: "B24EE1009", name: "Atharva Ajmera" },
  "CCCCCC": { rollNo: "B24EE1035", name: "Kushagra Khare" },
  "ABCDDD": { rollNo: "B24CM1041", name: "Kunal Singh" }
};

// 🔁 Poll State
let currentPoll = null;
let votes = {}; // { rollNo: "A", ... }
let pollEndTime = 0; // epoch ms

// ✅ Login
app.post('/validate', (req, res) => {
  const { code } = req.body;
  const student = students[code];
  if (student) {
    return res.json({ success: true, ...student });
  } else {
    return res.status(404).json({ success: false, message: "Invalid code" });
  }
});

// 🟢 Start Poll
app.post('/start_poll', (req, res) => {
  if (currentPoll && Date.now() < pollEndTime) {
    return res.status(400).json({ success: false, message: 'A poll is already active.' });
  }

  const { question, options, correct, duration } = req.body;
  
  if (!question || !options || !correct || !duration || duration <= 0) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  currentPoll = {
    question,
    options,
    correct,
    startedAt: Date.now(),
    duration: parseInt(duration)
  };

  pollEndTime = Date.now() + (currentPoll.duration * 1000);
  votes = {};

  console.log("🟢 New poll started:", currentPoll);
  res.json({ success: true });
});

// 🔴 End Poll Manually
app.post('/end_poll', (req, res) => {
  if (!currentPoll) {
    return res.status(400).json({ success: false, message: 'No active poll to end.' });
  }

  // Set poll end time to now to immediately end it
  pollEndTime = Date.now();
  
  console.log("🔴 Poll ended manually by instructor");
  res.json({ success: true, message: 'Poll ended successfully' });
});

// Instructor clicks "Logout All"
app.post("/logout_all", (req, res) => {
  globalLogout = true;
  res.json({ success: true });
});

// ESP32 checks this
app.get('/should_logout', (req, res) => {
  if (globalLogout) {
    globalLogout = false; // ✅ RESET it after first trigger
    res.json({ logout: true });
  } else {
    res.json({ logout: false });
  }
});

// Optional reset route
app.post("/clear_logout_flag", (req, res) => {
  globalLogout = false;
  res.json({ cleared: true });
});





// 📥 Get Current Poll (ESP32)
app.get('/poll', (req, res) => {
  if (!currentPoll) return res.json({ active: false });

  const now = Date.now();
  const timeLeft = Math.max(0, Math.floor((pollEndTime - now) / 1000));
  const isActive = now < pollEndTime;

  res.json({
    active: isActive,
    timeLeft,
    question: currentPoll.question,
    options: currentPoll.options
  });
});

// 🗳️ Vote
app.post('/vote', (req, res) => {
  const { rollNo, vote } = req.body;

  if (!currentPoll || !currentPoll.correct || Date.now() > pollEndTime) {
    return res.status(400).json({ success: false, message: "Poll has ended" });
  }

  if (votes[rollNo]) {
    return res.status(400).json({ success: false, message: "You have already voted." });
  }

  if (!rollNo || !vote || !['A', 'B', 'C', 'D'].includes(vote)) {
    return res.status(400).json({ success: false, message: "Invalid vote data" });
  }

  votes[rollNo] = vote;
  console.log(`✅ Vote from ${rollNo}: ${vote}`);
  res.json({ success: true });
});


// 🧠 Result for a student
app.get('/student_result', (req, res) => {
  const { rollNo } = req.query;

  if (!votes[rollNo] || !currentPoll || Date.now() < pollEndTime) {
    return res.json({ ready: false });
  }

  const studentVote = votes[rollNo];
  const correct = currentPoll.correct;

  return res.json({
    ready: true,
    voted: studentVote,
    correct,
    isCorrect: studentVote === correct
  });
});

// 📊 Full Results
app.get('/results', (req, res) => {
  const tally = {};
  const detailed = [];

  for (const [rollNo, vote] of Object.entries(votes)) {
    const isCorrect = currentPoll && vote === currentPoll.correct;
    const student = Object.values(students).find(s => s.rollNo === rollNo);

    tally[vote] = (tally[vote] || 0) + 1;

    detailed.push({
      rollNo,
      name: student?.name || "Unknown",
      vote,
      correct: isCorrect
    });
  }

  return res.json({
    totalVotes: Object.keys(votes).length,
    question: currentPoll?.question || "",
    correctAnswer: currentPoll?.correct || "",
    summary: tally,
    details: detailed
  });
});

// 📤 Export to CSV
app.get('/export', (req, res, next) => {
  if (!currentPoll) return res.status(400).send("No poll");

  try {
    let csv = "Roll No,Name,Vote,Correct\n";
    for (const [rollNo, vote] of Object.entries(votes)) {
        const student = Object.values(students).find(s => s.rollNo === rollNo);
        const name = student?.name || "Unknown";
        const isCorrect = vote === currentPoll.correct ? "✅" : "❌";
        csv += `${rollNo},${name},${vote},${isCorrect}\n`;
    }

    const filePath = __dirname + "/poll_results.csv";
    fs.writeFileSync(filePath, csv);

    res.download(filePath, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Server live at http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
