const mongoose = require('mongoose');

/**
 * User/Instructor Schema
 * Represents instructors who can create polls and manage attendance
 */

const userSchema = new mongoose.Schema({
  // Basic Info
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-z0-9_]+$/,  // Only lowercase letters, numbers, underscore
    index: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6  // Will store hashed password
  },

  // Personal Info
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  // Role
  role: {
    type: String,
    enum: ['instructor', 'admin'],
    default: 'instructor'
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },

  isVerified: {
    type: Boolean,
    default: false  // Can be used for email verification
  },

  // Security
  lastLogin: {
    type: Date
  },

  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: {
    type: Date
  },

  // Master code verification (for registration)
  verifiedWithMasterCode: {
    type: Boolean,
    default: false
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
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance Methods

/**
 * Check if account is locked
 */
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Verify password (simple comparison for now)
 * TODO: Use bcrypt for production
 */
userSchema.methods.comparePassword = function(candidatePassword) {
  // For now, direct comparison
  // In production, use: bcrypt.compare(candidatePassword, this.password)
  return candidatePassword === this.password;
};

/**
 * Increment login attempts
 */
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  await this.updateOne(updates);
};

/**
 * Reset login attempts
 */
userSchema.methods.resetLoginAttempts = async function() {
  await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

/**
 * Get public profile (without sensitive data)
 */
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
};

/**
 * Update last login
 */
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  await this.save();
};

// Static Methods

/**
 * Find user by username
 */
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

/**
 * Find user by email
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Register new user
 */
userSchema.statics.register = async function(userData) {
  const { username, password, name, email, masterCode } = userData;

  // Validate master code
  const validMasterCode = process.env.MASTER_CODE || 'IITJPM2025';
  if (masterCode !== validMasterCode) {
    throw new Error('Invalid master code');
  }

  // Check if username exists
  const existingUsername = await this.findByUsername(username);
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  // Check if email exists
  const existingEmail = await this.findByEmail(email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  // Validate password length
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Create user
  // TODO: Hash password with bcrypt in production
  const user = new this({
    username: username.toLowerCase(),
    password: password,  // In production: await bcrypt.hash(password, 10)
    name,
    email: email.toLowerCase(),
    role: 'instructor',
    isActive: true,
    verifiedWithMasterCode: true
  });

  await user.save();
  return user;
};

/**
 * Authenticate user
 */
userSchema.statics.authenticate = async function(username, password) {
  const user = await this.findByUsername(username);

  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw new Error('Account is temporarily locked. Try again later.');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  // Verify password
  const isMatch = user.comparePassword(password);

  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid username or password');
  }

  // Reset login attempts and update last login
  await user.resetLoginAttempts();
  await user.updateLastLogin();

  return user;
};

/**
 * Get all active instructors
 */
userSchema.statics.getActiveInstructors = function() {
  return this.find({ isActive: true, role: 'instructor' })
    .select('-password')
    .sort({ createdAt: -1 });
};

/**
 * Get user statistics
 */
userSchema.statics.getStatistics = async function() {
  const total = await this.countDocuments();
  const active = await this.countDocuments({ isActive: true });
  const instructors = await this.countDocuments({ role: 'instructor' });
  const admins = await this.countDocuments({ role: 'admin' });

  return {
    total,
    active,
    instructors,
    admins
  };
};

// Virtuals

/**
 * Virtual for account status
 */
userSchema.virtual('accountStatus').get(function() {
  if (this.isLocked()) return 'locked';
  if (!this.isActive) return 'inactive';
  if (!this.isVerified) return 'unverified';
  return 'active';
});

// Ensure virtuals are included in JSON (but exclude password)
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;  // Never include password in JSON
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
