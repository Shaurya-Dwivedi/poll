# Server Directory Structure

This directory contains all server-side code for the Polling-Meter application.

## 📁 Directory Structure

```
server/
├── config/           # Configuration files
│   └── database.js   # MongoDB connection setup
├── models/           # Mongoose models (schemas)
│   ├── Student.js    # Student model (TODO)
│   ├── Poll.js       # Poll model (TODO)
│   └── Attendance.js # Attendance model (TODO)
├── routes/           # API routes (future enhancement)
│   ├── auth.js       # Authentication routes
│   ├── polls.js      # Poll-related routes
│   └── attendance.js # Attendance routes
├── controllers/      # Business logic controllers (future enhancement)
│   ├── pollController.js
│   └── attendanceController.js
├── middleware/       # Custom middleware (future enhancement)
│   ├── auth.js       # Authentication middleware
│   └── validate.js   # Validation middleware
├── utils/            # Utility functions (future enhancement)
│   └── helpers.js    # Helper functions
└── server.js         # Main server file

```

## 🗄️ Models

### Student Model (Task 0.4)
- `code`: String (6 characters, unique)
- `rollNo`: String (unique)
- `name`: String

### Poll Model (Task 0.5)
- `question`: String
- `options`: Object { A, B, C, D }
- `correct`: String (A/B/C/D)
- `duration`: Number (seconds)
- `startTime`: Date
- `endTime`: Date
- `active`: Boolean
- `votes`: Array of vote records

### Attendance Model (Task 0.6)
- `code`: String (10 characters)
- `startTime`: Date
- `endTime`: Date
- `duration`: Number (minutes)
- `active`: Boolean
- `records`: Array of attendance records

## 🚀 Future Enhancements

### Routes (MVC Pattern)
Instead of having all routes in `server.js`, we can split them:
- `routes/auth.js` - Login, registration, validation
- `routes/polls.js` - Poll CRUD operations
- `routes/attendance.js` - Attendance operations

### Controllers
Separate business logic from routes:
- `controllers/pollController.js` - Poll business logic
- `controllers/attendanceController.js` - Attendance logic

### Middleware
Custom middleware for common operations:
- `middleware/auth.js` - Authentication checks
- `middleware/validate.js` - Request validation
- `middleware/errorHandler.js` - Error handling

## 📝 Current Status

**Completed:**
- ✅ Database connection setup
- ✅ Server configuration
- ✅ Basic API endpoints

**In Progress:**
- ⏳ Creating database models

**TODO:**
- [ ] Migrate endpoints to use database
- [ ] Implement MVC pattern (optional)
- [ ] Add authentication middleware
- [ ] Add request validation

## 🔧 Running the Server

From the project root:
```bash
npm start
```

The server will:
1. Load environment variables from `.env`
2. Connect to MongoDB
3. Start Express server on port 3000 (or PORT from .env)
4. Serve static files from `../public/`

## 🌐 API Endpoints

See main `README.md` for full API documentation.

## 📊 Environment Variables

Required in `.env`:
```
MONGODB_URI=mongodb+srv://...
PORT=3000
NODE_ENV=development
```

---

**Last Updated:** Task 0.3 - Server restructuring
