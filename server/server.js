let globalLogout = false;


let logoutAll = false;

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration - allow all origins for now (you can restrict later)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 3000;

// Import models
const Student = require('./models/Student');
const User = require('./models/User');
const Poll = require('./models/Poll');


// ✅ OLD: Hardcoded student DB (now using MongoDB Student model)
// ✅ OLD: Poll State (now using MongoDB Poll model)
// All poll data is now stored in the database

// ✅ Login - Validate Student Device Code
app.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: "Device code is required" });
    }
    
    // Find student by device code in database
    const student = await Student.findByDeviceCode(code);
    
    if (student && student.isActive) {
      return res.json({ 
        success: true, 
        rollNo: student.rollNo, 
        name: student.name,
        email: student.email,
        section: student.section,
        branch: student.branch
      });
    } else {
      return res.status(404).json({ success: false, message: "Invalid code" });
    }
  } catch (error) {
    console.error('❌ Validate error:', error);
    return res.status(500).json({ success: false, message: "Server error during validation" });
  }
});

// 🟢 Start Poll - Create new poll in database
app.post('/start_poll', async (req, res) => {
  try {
    // Check if there's already an active poll
    const activePoll = await Poll.findActivePoll();
    if (activePoll) {
      return res.status(400).json({ success: false, message: 'A poll is already active.' });
    }

    const { question, options, correct, duration } = req.body;
    
    if (!question || !options || !correct || !duration || duration <= 0) {
      return res.status(400).json({ success: false, message: "Missing or invalid fields" });
    }

    // Create new poll using the Poll model
    const poll = await Poll.createPoll({
      question,
      options,
      correct,
      duration: parseInt(duration)
    });

    console.log("🟢 New poll started:", poll._id);
    res.json({ success: true, pollId: poll._id });
  } catch (error) {
    console.error('❌ Start poll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔴 End Poll Manually
app.post('/end_poll', async (req, res) => {
  try {
    const activePoll = await Poll.findActivePoll();
    
    if (!activePoll) {
      return res.status(400).json({ success: false, message: 'No active poll to end.' });
    }

    // End the poll using the model method
    await activePoll.endPoll();
    
    console.log("🔴 Poll ended manually by instructor:", activePoll._id);
    res.json({ success: true, message: 'Poll ended successfully' });
  } catch (error) {
    console.error('❌ End poll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
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
app.get('/poll', async (req, res) => {
  try {
    const activePoll = await Poll.findActivePoll();
    
    if (!activePoll) {
      return res.json({ active: false });
    }

    // Check if poll has expired
    if (activePoll.isExpired()) {
      return res.json({ active: false });
    }

    const timeLeft = activePoll.getTimeLeft();

    res.json({
      active: true,
      timeLeft,
      question: activePoll.question,
      options: activePoll.options
    });
  } catch (error) {
    console.error('❌ Get poll error:', error);
    res.status(500).json({ active: false, error: error.message });
  }
});

// 🗳️ Vote
app.post('/vote', async (req, res) => {
  try {
    const { rollNo, vote } = req.body;

    if (!rollNo || !vote || !['A', 'B', 'C', 'D'].includes(vote)) {
      return res.status(400).json({ success: false, message: "Invalid vote data" });
    }

    // Find active poll
    const activePoll = await Poll.findActivePoll();
    
    if (!activePoll) {
      return res.status(400).json({ success: false, message: "No active poll" });
    }

    if (activePoll.isExpired()) {
      return res.status(400).json({ success: false, message: "Poll has ended" });
    }

    // Find student by roll number
    const student = await Student.findByRollNo(rollNo);
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Add vote to poll
    const result = await activePoll.addVote(student._id, rollNo, student.name, vote);
    
    console.log(`✅ Vote from ${rollNo}: ${vote}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Vote error:', error);
    
    if (error.message.includes('already voted')) {
      return res.status(400).json({ success: false, message: "You have already voted." });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});


// 🧠 Result for a student
app.get('/student_result', async (req, res) => {
  try {
    const { rollNo } = req.query;

    if (!rollNo) {
      return res.status(400).json({ ready: false, message: "Roll number required" });
    }

    // Find the most recent poll (active or completed)
    const poll = await Poll.findOne().sort({ createdAt: -1 });
    
    if (!poll) {
      return res.json({ ready: false });
    }

    // Check if poll has ended
    if (!poll.isExpired() && poll.active) {
      return res.json({ ready: false, message: "Poll is still active" });
    }

    // Find student's vote
    const studentVote = poll.votes.find(v => v.rollNo === rollNo);
    
    if (!studentVote) {
      return res.json({ ready: false, message: "No vote found" });
    }

    return res.json({
      ready: true,
      voted: studentVote.answer,
      correct: poll.correct,
      isCorrect: studentVote.answer === poll.correct
    });
  } catch (error) {
    console.error('❌ Student result error:', error);
    res.status(500).json({ ready: false, error: error.message });
  }
});

// 📊 Full Results
app.get('/results', async (req, res) => {
  try {
    // Get the most recent poll (active or completed)
    const poll = await Poll.findOne().sort({ createdAt: -1 });
    
    if (!poll) {
      return res.json({
        totalVotes: 0,
        question: "",
        correctAnswer: "",
        summary: {},
        details: []
      });
    }

    // Get results using the model method
    const results = poll.getResults();

    return res.json({
      totalVotes: results.totalVotes,
      question: poll.question,
      correctAnswer: poll.correct,
      summary: results.voteCounts,
      details: results.details
    });
  } catch (error) {
    console.error('❌ Results error:', error);
    res.status(500).json({ 
      totalVotes: 0,
      question: "",
      correctAnswer: "",
      summary: {},
      details: [],
      error: error.message 
    });
  }
});

// 📤 Export to CSV
app.get('/export', async (req, res, next) => {
  try {
    // Get the most recent poll
    const poll = await Poll.findOne().sort({ createdAt: -1 });
    
    if (!poll) {
      return res.status(400).send("No poll data available");
    }

    // Build CSV content
    let csv = "Roll No,Name,Vote,Correct\n";
    
    for (const vote of poll.votes) {
      const isCorrect = vote.answer === poll.correct ? "✅" : "❌";
      csv += `${vote.rollNo},${vote.studentName},${vote.answer},${isCorrect}\n`;
    }

    // Create temporary file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `poll_results_${timestamp}.csv`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, csv);

    res.download(filePath, fileName, (err) => {
      // Clean up the file after download
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
      });
      
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    console.error('❌ Export error:', error);
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
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// 👤 User Authentication Endpoints

// Register new instructor
app.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, masterCode } = req.body;

    if (!username || !password || !name || !email || !masterCode) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const user = await User.register({ username, password, name, email, masterCode });

    res.json({
      success: true,
      message: 'Registration successful',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const user = await User.authenticate(username, password);

    res.json({
      success: true,
      message: 'Login successful',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// Check if username exists
app.get('/check_username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findByUsername(username);

    res.json({
      exists: !!user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking username'
    });
  }
});

// Get user profile
app.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// 🔍 Search Students Endpoint
app.get('/search_students', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const searchTerm = query.trim();

    // Search by roll number (exact match) or name (partial match, case-insensitive)
    const students = await Student.find({
      $or: [
        { rollNo: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ],
      isActive: true
    })
    .select('sn name rollNo email section subGroup branch language deviceCode')
    .limit(20)  // Limit results to 20
    .sort({ rollNo: 1 });

    res.json({
      success: true,
      count: students.length,
      students: students
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching students',
      error: error.message 
    });
  }
});

// 🔍 Get All Students (with pagination)
app.get('/all_students', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const total = await Student.countDocuments({ isActive: true });
    const students = await Student.find({ isActive: true })
      .select('sn name rollNo email section subGroup branch language deviceCode')
      .skip(skip)
      .limit(limit)
      .sort({ rollNo: 1 });

    res.json({
      success: true,
      page: page,
      limit: limit,
      total: total,
      pages: Math.ceil(total / limit),
      students: students
    });

  } catch (error) {
    console.error('❌ Get all students error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching students',
      error: error.message 
    });
  }
});

// 🔍 Get Student by Roll Number
app.get('/student/:rollNo', async (req, res) => {
  try {
    const { rollNo } = req.params;
    
    const student = await Student.findByRollNo(rollNo);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    res.json({
      success: true,
      student: student
    });

  } catch (error) {
    console.error('❌ Get student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching student',
      error: error.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🟢 Server live at http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log(`${'='.repeat(50)}\n`);
});
