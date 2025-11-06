# ⚙️ Configuration Guide

## Quick Configuration Checklist

After deploying to Render, update these files:

### 1. ESP32 Arduino Code (`esp_code.ino`)

**Line 5-7:** Update WiFi and Server
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const String server = "https://your-app-name.onrender.com";  // NO trailing slash!
```

### 2. Dashboard HTML (`public/dashboard.html`)

**Line 91:** Update server URL
```javascript
// Option 1: Use empty string (same domain)
const server = "";

// Option 2: Use full URL (if hosting frontend separately)
// const server = "https://your-app-name.onrender.com";
```

### 3. Server Configuration (`server.js`)

**Lines 17-23:** Hardcoded student database
```javascript
const students = {
  "DDDDDD": { rollNo: "B24CH1038", name: "Shaurya Dwivedi" },
  "BBBBBB": { rollNo: "B24CI1048", name: "Samruddha Jadhav" },
  "AAAAAA": { rollNo: "B24EE1009", name: "Atharva Ajmera" },
  "CCCCCC": { rollNo: "B24EE1035", name: "Kushagra Khare" },
  "ABCDDD": { rollNo: "B24CM1041", name: "Kunal Singh" }
};
```

Add your own students here!

### 4. Login Page (`public/index.html`)

**Line 112:** Master registration code
```javascript
const MASTER_CODE = "XAI2025";  // Change this to your own secret code
```

## 🔗 Your Deployment URLs

After deploying to Render, you'll have:

- **API/Backend**: `https://your-app-name.onrender.com`
- **Login Page**: `https://your-app-name.onrender.com/`
- **Dashboard**: `https://your-app-name.onrender.com/dashboard.html`
- **Health Check**: `https://your-app-name.onrender.com/health`

## 🧪 Testing Endpoints

Test these URLs in your browser after deployment:

```
GET  /health              - Server health check
POST /validate            - Validate student code
POST /start_poll          - Start a new poll
GET  /poll                - Get current poll status
POST /vote                - Submit a vote
GET  /student_result      - Get student's result
GET  /results             - Get all results
GET  /export              - Download CSV
POST /logout_all          - Logout all devices
GET  /should_logout       - Check logout status
```

## 🎯 Default Credentials

### Student Codes (for ESP32):
- `DDDDDD` - Shaurya Dwivedi
- `BBBBBB` - Samruddha Jadhav
- `AAAAAA` - Atharva Ajmera
- `CCCCCC` - Kushagra Khare
- `ABCDDD` - Kunal Singh

### Instructor Login:
- Create new account with master code: `XAI2025`

## 🔐 Security Notes

**IMPORTANT**: Change these before production use!
- Master code in `index.html`
- Student codes in `server.js`
- Consider using environment variables for sensitive data

---

Save your configuration details here for reference! ✍️
