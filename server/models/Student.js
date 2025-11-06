const mongoose = require('mongoose');

/**
 * Student Schema
 * Represents a student in the polling system
 */

const studentSchema = new mongoose.Schema({
  // Serial Number (from CSV)
  sn: {
    type: Number,
    required: true,
    unique: true
  },
  
  // Student Name
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Roll Number (Primary identifier)
  rollNo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: /^B24[A-Z]{2}\d{4}$/  // Format: B24XX1234
  },
  
  // Email
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@iitj\.ac\.in$/  // Must be @iitj.ac.in
  },
  
  // Section (A or B)
  section: {
    type: String,
    required: true,
    enum: ['A', 'B'],
    uppercase: true
  },
  
  // Sub Group (A1, A2, ... B7, etc.)
  subGroup: {
    type: String,
    required: true,
    uppercase: true,
    match: /^[AB]\d{1}$/  // Format: A1, B2, etc.
  },
  
  // Branch/Department
  branch: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['AI', 'BB', 'CH', 'CI', 'CS', 'CY', 'DS', 'EE', 'ME', 'MT', 'PH']
  },
  
  // Language of Instruction
  language: {
    type: String,
    required: true,
    enum: ['English', 'Non English (Conversational Language)'],
    default: 'English'
  },
  
  // 6-digit unique code for ESP32 login (generated or assigned)
  deviceCode: {
    type: String,
    unique: true,
    sparse: true,  // Allows multiple null values
    uppercase: true,
    minlength: 6,
    maxlength: 6,
    match: /^[A-D]{6}$/  // Only A, B, C, D characters
  },
  
  // Tracking fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Active status
  isActive: {
    type: Boolean,
    default: true
  }
});

// Update the updatedAt timestamp before saving
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to generate device code
studentSchema.methods.generateDeviceCode = function() {
  // Generate random 6-character code using only A, B, C, D
  const chars = 'ABCD';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.deviceCode = code;
  return code;
};

// Static method to find student by roll number
studentSchema.statics.findByRollNo = function(rollNo) {
  return this.findOne({ rollNo: rollNo.toUpperCase() });
};

// Static method to find student by device code
studentSchema.statics.findByDeviceCode = function(code) {
  return this.findOne({ deviceCode: code.toUpperCase() });
};

// Static method to get students by section
studentSchema.statics.findBySection = function(section) {
  return this.find({ section: section.toUpperCase(), isActive: true });
};

// Static method to get students by branch
studentSchema.statics.findByBranch = function(branch) {
  return this.find({ branch: branch.toUpperCase(), isActive: true });
};

// Virtual for display name (Name - Roll No)
studentSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.rollNo})`;
});

// Ensure virtuals are included in JSON
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
