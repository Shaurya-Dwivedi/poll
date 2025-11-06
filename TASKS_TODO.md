# 📋 Project Tasks Tracker

## Current Sprint: Database Setup + Attendance Feature

---

## 🗄️ Phase 0: MongoDB Database Setup

### Task 0.1: MongoDB Atlas Setup Guide ⏳ IN PROGRESS
- [ ] Create step-by-step guide for MongoDB Atlas account
- [ ] Document cluster creation process
- [ ] Get connection string format
- [ ] Add to documentation

### Task 0.2: Install Database Dependencies
- [ ] Add mongoose to package.json
- [ ] Add dotenv for environment variables
- [ ] Update package.json with new dependencies
- [ ] Test npm install

### Task 0.3: Database Connection Setup
- [ ] Create database configuration file
- [ ] Add MongoDB connection string to .env.example
- [ ] Implement connection logic in server.js
- [ ] Add connection error handling
- [ ] Add connection success logging

### Task 0.4: Create Student Schema/Model
- [ ] Define Student schema (code, rollNo, name)
- [ ] Create Student model
- [ ] Add validation rules
- [ ] Create models/Student.js file

### Task 0.5: Create Poll Schema/Model
- [ ] Define Poll schema (question, options, correct, duration, startTime, endTime)
- [ ] Create Poll model
- [ ] Add vote tracking
- [ ] Create models/Poll.js file

### Task 0.6: Create Attendance Schema/Model
- [ ] Define Attendance Session schema (code, startTime, endTime, duration)
- [ ] Define Attendance Record schema (rollNo, name, timestamp)
- [ ] Create Attendance models
- [ ] Create models/Attendance.js file

### Task 0.7: Migrate Existing Student Data
- [ ] Create seed script for initial student data
- [ ] Move hardcoded students to database
- [ ] Test student data retrieval
- [ ] Create scripts/seedStudents.js

### Task 0.8: Update Existing Endpoints to Use Database
- [ ] Update POST /validate to query database
- [ ] Update POST /start_poll to use Poll model
- [ ] Update GET /poll to query database
- [ ] Update POST /vote to save to database
- [ ] Update GET /results to query database
- [ ] Update GET /export to query database
- [ ] Test all existing functionality

---

## 🎓 Phase 1: Attendance Backend

### Task 1.1: Add Attendance Data Structures
- [ ] Create AttendanceSession model (done in 0.6)
- [ ] Create AttendanceRecord model (done in 0.6)
- [ ] Add helper function to generate 10-digit A/B/C/D code

### Task 1.2: Create /start_attendance Endpoint
- [ ] Accept duration parameter
- [ ] Generate random 10-digit code (A/B/C/D)
- [ ] Save session to database
- [ ] Return success + code
- [ ] Add validation

### Task 1.3: Create /get_attendance Endpoint
- [ ] Check if attendance session is active
- [ ] Return session details (code, time left)
- [ ] Return null if no active session

### Task 1.4: Create /mark_attendance Endpoint
- [ ] Accept rollNo and attendance code
- [ ] Validate student exists
- [ ] Validate code matches current session
- [ ] Check if already marked
- [ ] Save attendance record to database
- [ ] Return success/error

### Task 1.5: Create /end_attendance Endpoint
- [ ] End current attendance session
- [ ] Update endTime in database
- [ ] Return success message

### Task 1.6: Create /attendance_results Endpoint
- [ ] Query all attendance records for session
- [ ] Return list of students who marked attendance
- [ ] Include timestamp for each record

### Task 1.7: Create /export_attendance Endpoint
- [ ] Query attendance records
- [ ] Generate CSV file
- [ ] Include date, time, rollNo, name
- [ ] Return downloadable CSV

---

## 🖥️ Phase 2: Dashboard UI for Attendance

### Task 2.1: Add Attendance Card to Dashboard
- [ ] Create new card section below poll section
- [ ] Add attendance heading
- [ ] Style to match existing design
- [ ] Add dark mode support

### Task 2.2: Add Duration Input Field
- [ ] Add input for attendance duration (minutes)
- [ ] Add default value (5 minutes)
- [ ] Add validation (min 1, max 60)

### Task 2.3: Add Start Attendance Button
- [ ] Create "Start Attendance" button
- [ ] Add click handler
- [ ] Call /start_attendance endpoint
- [ ] Display generated code on success

### Task 2.4: Add End Attendance Button
- [ ] Create "End Attendance" button
- [ ] Show only when attendance is active
- [ ] Add confirmation dialog
- [ ] Call /end_attendance endpoint

### Task 2.5: Display Generated Code
- [ ] Show 10-digit code prominently
- [ ] Add copy-to-clipboard button
- [ ] Display timer countdown
- [ ] Update timer every second

### Task 2.6: Show Live Attendance List
- [ ] Create table for attendance records
- [ ] Auto-refresh every 3 seconds
- [ ] Show rollNo, name, timestamp
- [ ] Show total count

### Task 2.7: Add Export Attendance CSV Button
- [ ] Create "Download CSV" button
- [ ] Call /export_attendance endpoint
- [ ] Trigger file download
- [ ] Show success message

---

## 🎮 Phase 3: ESP32 Arduino Code Updates

### Task 3.1: Update Post-Result Menu System
- [ ] Change from 2 options to 4 options
- [ ] Option A: Look for Poll
- [ ] Option B: Logout
- [ ] Option C: Mark Attendance
- [ ] Option D: View Rank (placeholder for now)
- [ ] Update LCD display logic

### Task 3.2: Add Attendance Code Entry Screen
- [ ] Create new state for attendance mode
- [ ] Show "Enter Attd Code:" on LCD
- [ ] Allow 10-character input using A/B/C/D buttons
- [ ] Add backspace support
- [ ] Show entered characters on LCD

### Task 3.3: Add Attendance Submission Logic
- [ ] Create submitAttendance() function
- [ ] Send POST request to /mark_attendance
- [ ] Include rollNo and entered code
- [ ] Parse server response

### Task 3.4: Add Attendance Feedback
- [ ] Show "Attendance Marked!" on success
- [ ] Blink GREEN LED for success
- [ ] Show "Invalid Code" on failure
- [ ] Blink RED LED for failure
- [ ] Show "Already Marked" if duplicate
- [ ] Return to menu after 2 seconds

### Task 3.5: Display Attendance Timer
- [ ] Fetch attendance status from /get_attendance
- [ ] Show time remaining on LCD
- [ ] Update every second while in attendance mode
- [ ] Show "Attendance Closed" when expired

---

## 🧪 Phase 4: Testing & Documentation

### Task 4.1: Test Full Attendance Flow
- [ ] Test: Professor starts attendance
- [ ] Test: Code appears on dashboard and ESP32
- [ ] Test: Student marks attendance successfully
- [ ] Test: Duplicate attendance prevention
- [ ] Test: Invalid code rejection
- [ ] Test: Timer expiration
- [ ] Test: Manual end attendance
- [ ] Test: CSV export

### Task 4.2: Handle Edge Cases
- [ ] Test: Start attendance while poll is active
- [ ] Test: Start poll while attendance is active
- [ ] Test: Server restart during attendance session
- [ ] Test: Network interruption
- [ ] Test: Multiple ESP32 devices simultaneously
- [ ] Test: Very long student names
- [ ] Test: Special characters in names

### Task 4.3: Add Documentation
- [ ] Update README.md with attendance feature
- [ ] Update FEATURES.md with attendance details
- [ ] Add attendance API documentation
- [ ] Update QUICKSTART.md
- [ ] Add screenshots to documentation
- [ ] Update CHANGELOG.md

### Task 4.4: Code Cleanup
- [ ] Remove old in-memory data structures
- [ ] Add code comments
- [ ] Format code consistently
- [ ] Remove console.log debug statements
- [ ] Optimize database queries

---

## 🚀 Phase 5: Future Enhancements (Backlog)

### Rank Feature (Task 3.1 - Option D)
- [ ] Design ranking algorithm
- [ ] Track student performance across polls
- [ ] Create /get_rank endpoint
- [ ] Display rank on ESP32
- [ ] Show leaderboard on dashboard

### Advanced Features
- [ ] Multi-class support
- [ ] Scheduled attendance
- [ ] QR code attendance option
- [ ] Attendance reports (weekly, monthly)
- [ ] Email notifications
- [ ] SMS integration
- [ ] Mobile app

---

## 📊 Progress Tracker

**Phase 0 (Database)**: 0/8 tasks completed (0%)
**Phase 1 (Backend)**: 0/7 tasks completed (0%)
**Phase 2 (Dashboard)**: 0/7 tasks completed (0%)
**Phase 3 (ESP32)**: 0/5 tasks completed (0%)
**Phase 4 (Testing)**: 0/4 tasks completed (0%)

**Overall Progress**: 0/31 tasks completed (0%)

---

## 🎯 Current Focus

**NOW**: Task 0.1 - MongoDB Atlas Setup Guide

**NEXT**: Task 0.2 - Install Database Dependencies

---

## 📝 Notes & Decisions

- **Database Choice**: MongoDB Atlas (free tier)
- **ORM**: Mongoose
- **Attendance Code Format**: 10 digits using only A, B, C, D (e.g., ABCDABCDAB)
- **Menu Navigation**: Using physical buttons A, B, C, D for options
- **Timer**: Customizable duration in minutes
- **Dark Mode**: Already implemented ✅

---

**Last Updated**: Task tracker created
**Next Update**: After Task 0.1 completion
