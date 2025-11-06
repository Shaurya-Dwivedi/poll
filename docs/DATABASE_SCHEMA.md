# 🗄️ Database Schema Documentation

Complete database schema for the Polling-Meter project.

---

## 📊 Current Schema (Implemented)

### Student Model ✅

**Collection**: `students`
**File**: `server/models/Student.js`
**Status**: Implemented and populated with 555 students

```javascript
{
  sn: Number,                    // Serial number (1-555)
  name: String,                  // Full name
  rollNo: String,                // Format: B24XX1234 (unique, indexed)
  email: String,                 // @iitj.ac.in (unique)
  section: String,               // 'A' or 'B'
  subGroup: String,              // A1, A2, ... B7, etc.
  branch: String,                // AI, BB, CH, CI, CS, CY, DS, EE, ME, MT, PH
  language: String,              // 'English' or 'Non English (Conversational Language)'
  deviceCode: String,            // 6-digit code using A/B/C/D (unique, for ESP32)
  isActive: Boolean,             // true/false (default: true)
  createdAt: Date,               // Auto-generated
  updatedAt: Date                // Auto-updated
}
```

**Indexes**:
- rollNo (unique)
- deviceCode (unique, sparse)
- email (unique)

**Methods**:
- `generateDeviceCode()` - Generate random 6-char code
- `findByRollNo(rollNo)` - Static method
- `findByDeviceCode(code)` - Static method
- `findBySection(section)` - Static method
- `findByBranch(branch)` - Static method

**Virtuals**:
- `displayName` - Returns "Name (RollNo)"

**Example Document**:
```json
{
  "_id": "673456789abcdef012345678",
  "sn": 1,
  "name": "AANCHAL BHASKAR SHUKLA",
  "rollNo": "B24BB1001",
  "email": "shukla.1@iitj.ac.in",
  "section": "A",
  "subGroup": "A1",
  "branch": "BB",
  "language": "English",
  "deviceCode": "ABCDAC",
  "isActive": true,
  "createdAt": "2024-11-06T10:30:00.000Z",
  "updatedAt": "2024-11-06T10:30:00.000Z"
}
```

---

## 📋 Implemented Schema (Ready to Use)

### Poll Model ✅

**Collection**: `polls`
**File**: `server/models/Poll.js`
**Status**: Implemented, endpoints need migration

```javascript
{
  question: String,              // Poll question
  options: {                     // Answer options
    A: String,
    B: String,
    C: String,
    D: String
  },
  correct: String,               // Correct answer (A/B/C/D)
  duration: Number,              // Duration in seconds
  startTime: Date,               // When poll started
  endTime: Date,                 // When poll ends/ended
  active: Boolean,               // Is poll currently active
  createdBy: String,             // Instructor username/id
  votes: [{                      // Array of votes
    studentId: ObjectId,         // Reference to Student
    rollNo: String,
    vote: String,                // A/B/C/D
    timestamp: Date,
    isCorrect: Boolean           // Calculated
  }],
  totalVotes: Number,            // Calculated
  results: {                     // Vote counts
    A: Number,
    B: Number,
    C: Number,
    D: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- active (for quick lookup)
- startTime (for history)
- createdBy (for instructor queries)

**Methods**:
- `isExpired()` - Check if poll has ended
- `addVote(studentId, vote)` - Record a vote
- `getResults()` - Calculate vote counts
- `findActivePolls()` - Static method

### Attendance Model ✅

**Collection**: `attendances`
**File**: `server/models/Attendance.js`
**Status**: Implemented, endpoints not yet created

```javascript
{
  code: String,                  // 10-digit code (A/B/C/D)
  startTime: Date,               // When attendance started
  endTime: Date,                 // When attendance ends/ended
  duration: Number,              // Duration in minutes
  active: Boolean,               // Is attendance currently active
  createdBy: String,             // Instructor username/id
  records: [{                    // Array of attendance records
    studentId: ObjectId,         // Reference to Student
    rollNo: String,
    name: String,
    timestamp: Date,             // When they marked attendance
    marked: Boolean              // true if present
  }],
  totalPresent: Number,          // Count of students present
  totalAbsent: Number,           // Count of students absent
  date: Date,                    // Date of attendance (for records)
  section: String,               // Which section (A/B) or 'ALL'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- active (for quick lookup)
- code (for validation)
- date (for historical queries)
- createdBy (for instructor queries)

**Methods**:
- `isExpired()` - Check if attendance period has ended
- `markAttendance(studentId)` - Record attendance
- `getAbsentees()` - Calculate who's absent
- `findActiveAttendance()` - Static method

### User/Instructor Model ✅

**Collection**: `users`
**File**: `server/models/User.js`
**Status**: Fully implemented and integrated

```javascript
{
  username: String,              // Unique username
  password: String,              // Hashed password
  email: String,                 // Email address
  role: String,                  // 'instructor' or 'admin'
  name: String,                  // Full name
  isActive: Boolean,             // Account status
  lastLogin: Date,               // Last login timestamp
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 Relationships

### Current:
- None (Student is standalone)

### Planned:
- Poll → Student (votes reference students)
- Attendance → Student (records reference students)
- Poll → User (createdBy references instructor)
- Attendance → User (createdBy references instructor)

---

## 📈 Data Statistics

### Current Database State

**Students Collection**:
- Total Documents: 555
- Branches: AI (50), BB (50), CH (50), CI (50), CS (50), CY (50), DS (50), EE (50), ME (50), MT (50), PH (55)
- Sections: A (~277), B (~278)
- Device Codes: All unique, 6 characters each
- Storage: ~500KB

**Polls Collection**: (Not yet in DB)
- Currently: In-memory storage
- To migrate: Create Poll model first

**Attendances Collection**: (Not yet created)
- Currently: Not implemented
- To create: After Poll model

---

## 🔍 Query Examples

### Students

```javascript
// Find by roll number
await Student.findByRollNo('B24CH1038');

// Find by device code
await Student.findByDeviceCode('ABCDAC');

// Search by name (partial, case-insensitive)
await Student.find({ 
  name: { $regex: 'Shaurya', $options: 'i' } 
});

// Get all students in section A
await Student.findBySection('A');

// Get all CS students
await Student.findByBranch('CS');

// Count total students
await Student.countDocuments({ isActive: true });

// Pagination
await Student.find()
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ rollNo: 1 });
```

### Polls (Future)

```javascript
// Get active poll
await Poll.findOne({ active: true });

// Get poll history
await Poll.find({ createdBy: instructorId })
  .sort({ startTime: -1 })
  .limit(10);

// Get poll results
const poll = await Poll.findById(pollId);
const results = poll.getResults();
```

### Attendance (Future)

```javascript
// Get active attendance
await Attendance.findOne({ active: true });

// Get today's attendance
await Attendance.find({
  date: { 
    $gte: new Date().setHours(0,0,0,0),
    $lt: new Date().setHours(23,59,59,999)
  }
});

// Get absentees
const attendance = await Attendance.findById(attendanceId);
const absentees = await attendance.getAbsentees();
```

---

## 🔒 Data Security

### Current Measures:
- MongoDB connection string in .env (not committed)
- Validation at schema level (regex, enums)
- Unique constraints on critical fields

### To Implement:
- Password hashing (bcrypt)
- JWT tokens for API authentication
- Rate limiting on API endpoints
- Input sanitization
- CORS restrictions in production

---

## 🔄 Migration Strategy

### Phase 1: Students (DONE ✅)
1. Create Student model
2. Create seed script
3. Import CSV data
4. Verify all 555 students

### Phase 2: Polls (TODO)
1. Create Poll model
2. Migrate current in-memory poll logic
3. Update all poll endpoints
4. Test poll creation and voting

### Phase 3: Attendance (TODO)
1. Create Attendance model
2. Implement attendance endpoints
3. Update ESP32 code
4. Test full attendance flow

### Phase 4: Users (Future)
1. Create User model
2. Implement authentication
3. Add JWT middleware
4. Migrate from localStorage

---

## 📊 Index Strategy

### Critical Indexes (Must Have):
- Student.rollNo (unique)
- Student.deviceCode (unique, sparse)
- Student.email (unique)
- Poll.active (for quick active poll lookup)
- Attendance.active (for quick active attendance lookup)

### Performance Indexes (Nice to Have):
- Student.section (for filtering)
- Student.branch (for filtering)
- Poll.startTime (for history queries)
- Attendance.date (for date range queries)
- Poll.createdBy (for instructor queries)

---

## 🧪 Test Data

### Sample Student (Real):
```json
{
  "sn": 38,
  "name": "SHAURYA DWIVEDI",
  "rollNo": "B24CH1038",
  "email": "dwivedi.29@iitj.ac.in",
  "section": "A",
  "subGroup": "A5",
  "branch": "CH",
  "language": "English",
  "deviceCode": "DDDDDD"
}
```

### Sample Poll (Template):
```json
{
  "question": "What is 2+2?",
  "options": {
    "A": "3",
    "B": "4",
    "C": "5",
    "D": "6"
  },
  "correct": "B",
  "duration": 60,
  "active": true
}
```

---

## 📝 Change Log

- **2024-11-06**: Created Student model with 555 students
- **2024-11-06**: Added MT branch to enum
- **2024-11-06**: Seeded all student data successfully
- **Future**: Will add Poll and Attendance models

---

**Last Updated**: After completing all 4 models (Student, Poll, Attendance, User)
**Next**: Migrate poll endpoints to use Poll model (Task 0.8)
