const mongoose = require('mongoose');

/**
 * Poll Schema
 * Represents a poll/quiz with questions and votes
 */

// Vote sub-schema
const voteSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  rollNo: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D'],
    uppercase: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Main Poll schema
const pollSchema = new mongoose.Schema({
  // Poll details
  question: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 500
  },

  options: {
    A: {
      type: String,
      required: true,
      trim: true
    },
    B: {
      type: String,
      required: true,
      trim: true
    },
    C: {
      type: String,
      required: true,
      trim: true
    },
    D: {
      type: String,
      required: true,
      trim: true
    }
  },

  correct: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D'],
    uppercase: true
  },

  // Timing
  duration: {
    type: Number,
    required: true,
    min: 10,
    max: 600  // Max 10 minutes
  },

  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },

  endTime: {
    type: Date,
    required: false  // Will be set by pre-save hook or createPoll method
  },

  // Status
  active: {
    type: Boolean,
    default: true,
    index: true
  },

  // Votes
  votes: [voteSchema],

  // Results (calculated)
  voteCount: {
    A: { type: Number, default: 0 },
    B: { type: Number, default: 0 },
    C: { type: Number, default: 0 },
    D: { type: Number, default: 0 }
  },

  totalVotes: {
    type: Number,
    default: 0
  },

  // Creator info (optional - for future multi-instructor support)
  createdBy: {
    type: String,
    default: 'instructor'
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

// Indexes
pollSchema.index({ active: 1, startTime: -1 });
pollSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate endTime
pollSchema.pre('save', function(next) {
  if (this.isNew && !this.endTime) {
    this.endTime = new Date(this.startTime.getTime() + this.duration * 1000);
  }
  this.updatedAt = Date.now();
  next();
});

// Instance Methods

/**
 * Check if poll is expired
 */
pollSchema.methods.isExpired = function() {
  return Date.now() >= this.endTime.getTime();
};

/**
 * Get time left in seconds
 */
pollSchema.methods.getTimeLeft = function() {
  const timeLeft = Math.floor((this.endTime.getTime() - Date.now()) / 1000);
  return timeLeft > 0 ? timeLeft : 0;
};

/**
 * Add a vote to the poll
 */
pollSchema.methods.addVote = async function(studentId, rollNo, name, vote) {
  // Check if student already voted
  const existingVote = this.votes.find(v => v.rollNo === rollNo);
  if (existingVote) {
    throw new Error('Student has already voted');
  }

  // Check if poll is still active
  if (!this.active || this.isExpired()) {
    throw new Error('Poll is not active');
  }

  // Validate vote
  if (!['A', 'B', 'C', 'D'].includes(vote.toUpperCase())) {
    throw new Error('Invalid vote option');
  }

  const voteUpper = vote.toUpperCase();
  const isCorrect = voteUpper === this.correct;

  // Add vote
  this.votes.push({
    student: studentId,
    rollNo: rollNo,
    studentName: name,
    answer: voteUpper,
    isCorrect: isCorrect,
    timestamp: new Date()
  });

  // Update vote counts
  this.voteCount[voteUpper]++;
  this.totalVotes++;

  await this.save();
  return { success: true, isCorrect: isCorrect };
};

/**
 * Get poll results
 */
pollSchema.methods.getResults = function() {
  const details = this.votes.map(v => ({
    rollNo: v.rollNo,
    name: v.studentName,
    vote: v.answer,
    correct: v.isCorrect
  }));

  return {
    question: this.question,
    correct: this.correct,
    voteCounts: this.voteCount,
    totalVotes: this.totalVotes,
    details: details
  };
};

/**
 * Get student result
 */
pollSchema.methods.getStudentResult = function(rollNo) {
  const vote = this.votes.find(v => v.rollNo === rollNo);
  
  if (!vote) {
    return { ready: false };
  }

  return {
    ready: true,
    voted: true,
    vote: vote.answer,
    correct: this.correct,
    isCorrect: vote.isCorrect
  };
};

/**
 * End poll manually
 */
pollSchema.methods.endPoll = async function() {
  this.active = false;
  this.endTime = new Date();
  await this.save();
};

// Static Methods

/**
 * Find active poll
 */
pollSchema.statics.findActivePoll = function() {
  return this.findOne({ active: true });
};

/**
 * Create new poll
 */
pollSchema.statics.createPoll = async function(pollData) {
  const { question, options, correct, duration } = pollData;

  // Validate required fields
  if (!question || !options || !correct || !duration) {
    throw new Error('Missing required poll fields');
  }

  // Check if there's already an active poll
  const existingPoll = await this.findActivePoll();
  if (existingPoll && !existingPoll.isExpired()) {
    throw new Error('A poll is already active');
  }

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + parseInt(duration) * 1000);

  // Create new poll
  const poll = new this({
    question,
    options,
    correct: correct.toUpperCase(),
    duration: parseInt(duration),
    startTime: startTime,
    endTime: endTime,
    active: true
  });

  await poll.save();
  return poll;
};

/**
 * Get poll history
 */
pollSchema.statics.getPollHistory = function(limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-votes');  // Exclude votes for performance
};

/**
 * Get poll statistics
 */
pollSchema.statics.getStatistics = async function() {
  const totalPolls = await this.countDocuments();
  const activePolls = await this.countDocuments({ active: true });
  const totalVotes = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$totalVotes' } } }
  ]);

  return {
    totalPolls,
    activePolls,
    totalVotes: totalVotes[0]?.total || 0
  };
};

// Virtual for checking if poll should auto-expire
pollSchema.virtual('shouldExpire').get(function() {
  return this.active && this.isExpired();
});

// Ensure virtuals are included in JSON
pollSchema.set('toJSON', { virtuals: true });
pollSchema.set('toObject', { virtuals: true });

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;
