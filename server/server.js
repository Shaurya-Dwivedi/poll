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
const Attendance = require('./models/Attendance');


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
    // Get the currently active poll only
    const poll = await Poll.findActivePoll();
    
    if (!poll) {
      return res.json({
        active: false,
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
      active: true,
      pollId: poll._id,
      totalVotes: results.totalVotes,
      question: poll.question,
      correctAnswer: poll.correct,
      summary: results.voteCounts,
      details: results.details
    });
  } catch (error) {
    console.error('❌ Results error:', error);
    res.status(500).json({ 
      active: false,
      totalVotes: 0,
      question: "",
      correctAnswer: "",
      summary: {},
      details: [],
      error: error.message 
    });
  }
});

// 📜 Get Poll History (all completed polls)
app.get('/poll_history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    
    // Get all polls sorted by most recent first
    const polls = await Poll.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('question options correct votes createdAt active startTime endTime');

    const total = await Poll.countDocuments();

    const history = polls.map(poll => {
      const results = poll.getResults();
      return {
        pollId: poll._id,
        question: poll.question,
        options: poll.options,
        correct: poll.correct,
        active: poll.active,
        createdAt: poll.createdAt,
        startTime: poll.startTime,
        endTime: poll.endTime,
        totalVotes: results.totalVotes,
        voteCounts: results.voteCounts,
        details: results.details
      };
    });

    res.json({
      success: true,
      total: total,
      count: history.length,
      polls: history
    });
  } catch (error) {
    console.error('❌ Poll history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching poll history',
      error: error.message
    });
  }
});

// 🗑️ Delete Poll from History
app.delete('/poll/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params;
    
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Don't allow deleting active polls
    if (poll.active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active poll'
      });
    }

    await Poll.findByIdAndDelete(pollId);

    res.json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting poll',
      error: error.message
    });
  }
});

// 📤 Export Individual Poll to CSV
app.get('/export_poll/:pollId', async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).send("Poll not found");
    }

    // Build CSV content
    let csv = "Roll No,Name,Vote,Correct\n";
    
    for (const vote of poll.votes) {
      const isCorrect = vote.answer === poll.correct ? "Yes" : "No";
      csv += `${vote.rollNo},${vote.studentName},${vote.answer},${isCorrect}\n`;
    }

    // Create temporary file
    const timestamp = new Date(poll.createdAt).toISOString().replace(/[:.]/g, '-');
    const fileName = `poll_${pollId}_${timestamp}.csv`;
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
    console.error('❌ Export poll error:', error);
    next(error);
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

// ============================================================
// 🎓 ATTENDANCE ENDPOINTS
// ============================================================

// 🟢 Start Attendance Session
app.post('/start_attendance', async (req, res) => {
  try {
    const { duration, section } = req.body;

    // Validate input
    const durationNum = parseInt(duration);
    if (duration === undefined || duration === null || isNaN(durationNum) || durationNum < 1 || durationNum > 60) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duration must be between 1 and 60 minutes' 
      });
    }

    // Check if there's already an active attendance session
    const activeSession = await Attendance.findActiveSession();
    if (activeSession) {
      return res.status(400).json({ 
        success: false, 
        message: 'An attendance session is already active' 
      });
    }

    // Create new attendance session using the model method
    const session = await Attendance.createSession({
      duration: durationNum,
      section: section || 'ALL'
    });

    console.log(`🟢 Attendance session started: ${session.code} for ${durationNum} minutes`);
    res.json({ 
      success: true, 
      sessionId: session._id,
      code: session.code,
      duration: session.duration,
      endTime: session.endTime
    });
  } catch (error) {
    console.error('❌ Start attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 📥 Get Active Attendance Session (for ESP32)
app.get('/get_attendance', async (req, res) => {
  try {
    const activeSession = await Attendance.findActiveSession();

    if (!activeSession) {
      return res.json({ active: false });
    }

    // Check if session has expired
    if (activeSession.isExpired()) {
      return res.json({ active: false });
    }

    const timeLeft = activeSession.getTimeLeft();

    res.json({
      active: true,
      code: activeSession.code,
      timeLeft: timeLeft,
      duration: activeSession.duration,
      endTime: activeSession.endTime
    });
  } catch (error) {
    console.error('❌ Get attendance error:', error);
    res.status(500).json({ active: false, error: error.message });
  }
});

// ✅ Mark Attendance
app.post('/mark_attendance', async (req, res) => {
  try {
    const { rollNo, code } = req.body;

    if (!rollNo || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Roll number and code are required' 
      });
    }

    // Find active attendance session
    const activeSession = await Attendance.findActiveSession();

    if (!activeSession) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active attendance session' 
      });
    }

    if (activeSession.isExpired()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance session has ended' 
      });
    }

    // Validate the code
    if (code !== activeSession.code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid attendance code' 
      });
    }

    // Find student by roll number
    const student = await Student.findByRollNo(rollNo);

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Mark attendance using the model method
    await activeSession.markAttendance(
      student._id,
      student.rollNo,
      student.name,
      student.deviceCode || ''
    );

    console.log(`✅ Attendance marked: ${student.rollNo} - ${student.name}`);
    res.json({ 
      success: true,
      message: 'Attendance marked successfully',
      student: {
        rollNo: student.rollNo,
        name: student.name
      }
    });
  } catch (error) {
    console.error('❌ Mark attendance error:', error);

    if (error.message.includes('already marked')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance already marked for this student' 
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔴 End Attendance Session
app.post('/end_attendance', async (req, res) => {
  try {
    const activeSession = await Attendance.findActiveSession();

    if (!activeSession) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active attendance session to end' 
      });
    }

    // End the session using the model method
    await activeSession.endSession();

    console.log(`🔴 Attendance session ended: ${activeSession.code}`);
    res.json({ 
      success: true, 
      message: 'Attendance session ended successfully' 
    });
  } catch (error) {
    console.error('❌ End attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 📊 Get Attendance Results
app.get('/attendance_results', async (req, res) => {
  try {
    // Get the most recent attendance session (active or completed)
    const session = await Attendance.findOne().sort({ createdAt: -1 });

    if (!session) {
      return res.json({
        active: false,
        totalPresent: 0,
        totalAbsent: 0,
        code: "",
        records: []
      });
    }

    // Get statistics using the model method
    const stats = session.getStatistics();

    res.json({
      success: true,
      active: session.active,
      sessionId: session._id,
      code: session.code,
      duration: session.duration,
      startTime: session.startTime,
      endTime: session.endTime,
      summary: {
        present: stats.totalPresent,
        totalStudents: stats.totalPresent + stats.totalAbsent,
        absent: stats.totalAbsent,
        presentPercentage: stats.presentPercentage
      },
      records: session.records.map(r => ({
        rollNo: r.rollNo,
        name: r.studentName,
        markedAt: r.markedAt
      }))
    });
  } catch (error) {
    console.error('❌ Attendance results error:', error);
    res.status(500).json({
      active: false,
      totalPresent: 0,
      totalAbsent: 0,
      code: "",
      records: [],
      error: error.message
    });
  }
});

// 📤 Export Attendance to CSV
app.get('/export_attendance', async (req, res, next) => {
  try {
    // Get the most recent attendance session
    const session = await Attendance.findOne().sort({ createdAt: -1 });

    if (!session) {
      return res.status(400).send("No attendance data available");
    }

    // Build CSV content
    let csv = "Roll No,Name,Status,Marked At\n";

    for (const record of session.records) {
      const markedAt = new Date(record.markedAt).toLocaleString();
      csv += `${record.rollNo},${record.studentName},Present,${markedAt}\n`;
    }

    // Create temporary file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `attendance_${session.code}_${timestamp}.csv`;
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
    console.error('❌ Export attendance error:', error);
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
