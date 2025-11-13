const mongoose = require('mongoose');

/**
 * Attendance Schema
 * Represents an attendance session with records
 */

// Attendance Record sub-schema
const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  rollNo: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  deviceCode: {
    type: String,
    required: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  present: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Main Attendance Session schema
const attendanceSchema = new mongoose.Schema({
  // Attendance code (10 digits, A/B/C/D only)
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 10,
    maxlength: 10,
    match: /^[ABCD]{10}$/,
    index: true
  },

  // Timing
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 60  // Max 60 minutes
  },

  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },

  endTime: {
    type: Date,
    required: false  // Will be set by pre-save hook or createSession method
  },

  // Status
  active: {
    type: Boolean,
    default: true,
    index: true
  },

  // Records
  records: [attendanceRecordSchema],

  // Statistics
  totalPresent: {
    type: Number,
    default: 0
  },

  totalExpected: {
    type: Number,
    default: 0  // Will be set based on total students
  },

  // Session details
  date: {
    type: Date,
    default: Date.now,
    index: true
  },

  section: {
    type: String,
    enum: ['A', 'B', 'ALL'],
    default: 'ALL',
    uppercase: true
  },

  // Creator info
  createdBy: {
    type: String,
    default: 'instructor'
  },

  // Notes (optional)
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
attendanceSchema.index({ active: 1, startTime: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ createdBy: 1, date: -1 });

// Pre-save middleware
attendanceSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate endTime from duration (in minutes)
    this.endTime = new Date(this.startTime.getTime() + this.duration * 60 * 1000);
  }
  this.updatedAt = Date.now();
  next();
});

// Instance Methods

/**
 * Check if attendance session is expired
 */
attendanceSchema.methods.isExpired = function() {
  return Date.now() >= this.endTime.getTime();
};

/**
 * Get time left in seconds
 */
attendanceSchema.methods.getTimeLeft = function() {
  const timeLeft = Math.floor((this.endTime.getTime() - Date.now()) / 1000);
  return timeLeft > 0 ? timeLeft : 0;
};

/**
 * Mark attendance for a student
 */
attendanceSchema.methods.markAttendance = async function(studentId, rollNo, studentName, deviceCode = '') {
  // Check if attendance is still active
  if (!this.active || this.isExpired()) {
    throw new Error('Attendance session is not active');
  }

  // Check if student already marked attendance
  const existingRecord = this.records.find(r => r.rollNo === rollNo);
  if (existingRecord) {
    throw new Error('Attendance already marked');
  }

  // Add attendance record
  this.records.push({
    student: studentId,
    rollNo: rollNo,
    name: studentName,
    deviceCode: deviceCode,
    markedAt: new Date(),
    present: true
  });

  // Update count
  this.totalPresent++;

  await this.save();
  return { success: true, message: 'Attendance marked successfully' };
};

/**
 * Get attendance summary
 */
attendanceSchema.methods.getSummary = function() {
  return {
    code: this.code,
    duration: this.duration,
    startTime: this.startTime,
    endTime: this.endTime,
    active: this.active,
    totalPresent: this.totalPresent,
    totalExpected: this.totalExpected,
    attendanceRate: this.totalExpected > 0 
      ? ((this.totalPresent / this.totalExpected) * 100).toFixed(2) 
      : 0,
    timeLeft: this.getTimeLeft()
  };
};

/**
 * Get attendance statistics for this session
 */
attendanceSchema.methods.getStatistics = function() {
  const totalAbsent = this.totalExpected - this.totalPresent;
  const presentPercentage = this.totalExpected > 0 
    ? ((this.totalPresent / this.totalExpected) * 100).toFixed(2) 
    : 0;

  return {
    totalPresent: this.totalPresent,
    totalAbsent: totalAbsent,
    totalExpected: this.totalExpected,
    presentPercentage: presentPercentage
  };
};

/**
 * Get present students list
 */
attendanceSchema.methods.getPresentStudents = function() {
  return this.records
    .filter(r => r.present)
    .map(r => ({
      rollNo: r.rollNo,
      name: r.name,
      markedAt: r.markedAt
    }))
    .sort((a, b) => a.markedAt - b.markedAt);
};

/**
 * Get absentees (requires student list)
 */
attendanceSchema.methods.getAbsentees = async function() {
  const Student = mongoose.model('Student');
  
  // Get all active students
  const allStudents = await Student.find({ isActive: true }).select('rollNo name');
  
  // Get roll numbers of present students
  const presentRollNos = this.records.map(r => r.rollNo);
  
  // Find absentees
  const absentees = allStudents
    .filter(s => !presentRollNos.includes(s.rollNo))
    .map(s => ({
      rollNo: s.rollNo,
      name: s.name
    }));
  
  return absentees;
};

/**
 * End attendance session manually
 */
attendanceSchema.methods.endSession = async function() {
  this.active = false;
  this.endTime = new Date();
  await this.save();
};

/**
 * Export attendance to CSV format
 */
attendanceSchema.methods.toCSV = function() {
  const rows = [
    ['Date', 'Roll No', 'Name', 'Marked At', 'Status']
  ];
  
  this.records.forEach(record => {
    rows.push([
      this.date.toLocaleDateString(),
      record.rollNo,
      record.name,
      record.markedAt.toLocaleString(),
      record.present ? 'Present' : 'Absent'
    ]);
  });
  
  return rows.map(row => row.join(',')).join('\n');
};

// Static Methods

/**
 * Generate unique 10-digit attendance code
 */
attendanceSchema.statics.generateCode = async function() {
  const chars = 'ABCD';
  let code;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
    
    // Check if code already exists
    const existing = await this.findOne({ code: code });
    if (!existing) break;
    
    if (attempts >= maxAttempts) {
      throw new Error('Could not generate unique attendance code after 100 attempts');
    }
  } while (true);

  return code;
};

/**
 * Find active attendance session
 */
attendanceSchema.statics.findActiveSession = function() {
  return this.findOne({ active: true });
};

/**
 * Create new attendance session
 */
attendanceSchema.statics.createSession = async function(sessionData) {
  const { duration, section, notes } = sessionData;

  // Validate duration
  if (!duration || duration < 1 || duration > 60) {
    throw new Error('Duration must be between 1 and 60 minutes');
  }

  // Check if there's already an active session
  const existingSession = await this.findActiveSession();
  if (existingSession && !existingSession.isExpired()) {
    throw new Error('An attendance session is already active');
  }

  // Generate unique code
  const code = await this.generateCode();

  // Get total expected students
  const Student = mongoose.model('Student');
  let query = { isActive: true };
  if (section && section !== 'ALL') {
    query.section = section;
  }
  const totalExpected = await Student.countDocuments(query);

  // Calculate start and end times
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + parseInt(duration) * 60 * 1000);

  // Create new session
  const session = new this({
    code,
    duration: parseInt(duration),
    startTime: startTime,
    endTime: endTime,
    active: true,
    section: section || 'ALL',
    notes: notes || '',
    totalExpected
  });

  await session.save();
  return session;
};

/**
 * Get attendance history
 */
attendanceSchema.statics.getHistory = function(limit = 10) {
  return this.find()
    .sort({ date: -1 })
    .limit(limit)
    .select('-records');  // Exclude records for performance
};

/**
 * Get attendance by date range
 */
attendanceSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

/**
 * Get attendance statistics
 */
attendanceSchema.statics.getStatistics = async function() {
  const totalSessions = await this.countDocuments();
  const activeSessions = await this.countDocuments({ active: true });
  
  const avgAttendance = await this.aggregate([
    {
      $group: {
        _id: null,
        avgPresent: { $avg: '$totalPresent' },
        avgExpected: { $avg: '$totalExpected' }
      }
    }
  ]);

  const avgRate = avgAttendance[0] 
    ? ((avgAttendance[0].avgPresent / avgAttendance[0].avgExpected) * 100).toFixed(2)
    : 0;

  return {
    totalSessions,
    activeSessions,
    averageAttendanceRate: avgRate
  };
};

// Virtuals

/**
 * Virtual for attendance rate
 */
attendanceSchema.virtual('attendanceRate').get(function() {
  if (this.totalExpected === 0) return 0;
  return ((this.totalPresent / this.totalExpected) * 100).toFixed(2);
});

/**
 * Virtual for checking if session should auto-expire
 */
attendanceSchema.virtual('shouldExpire').get(function() {
  return this.active && this.isExpired();
});

// Ensure virtuals are included in JSON
attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
