# 🚀 Quick Start Guide - Deploy in 10 Minutes!

## ✅ What's Been Done

Your project is now **ready for Render deployment**! Here's what was updated:

### Backend Changes:
- ✅ `package.json` - Added start script and Node.js engine specification
- ✅ `server.js` - Added health check, static file serving, CORS configuration
- ✅ Created `render.yaml` - Render configuration file
- ✅ Created `.env.example` - Environment variable template
- ✅ Updated `.gitignore` - Proper file exclusions

### Frontend Changes:
- ✅ `dashboard.html` - Updated to use relative URLs (works with Render)

### Arduino Changes:
- ✅ `esp_code.ino` - Updated with placeholder for your Render URL
- ✅ `esp_code_UPDATED.ino` - Enhanced version with better logging

---

## 🎯 Deployment Steps

### **Step 1: Push to GitHub** (5 minutes)

```bash
cd Polling-Meter-main
git init
git add .
git commit -m "Ready for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### **Step 2: Deploy on Render** (3 minutes)

1. Go to [https://render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `polling-meter` (or your choice)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **"Create Web Service"**
6. Wait 2-3 minutes for deployment
7. **Copy your URL**: `https://polling-meter-xxxx.onrender.com`

### **Step 3: Update ESP32 Code** (2 minutes)

1. Open `esp_code.ino` in Arduino IDE
2. Update **line 10-14**:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";          // Your WiFi name
   const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password
   const String server = "https://polling-meter-xxxx.onrender.com";  // Your Render URL
   ```
3. Upload to ESP32

---

## 🧪 Test Your Deployment

### Test 1: Health Check
Visit: `https://your-url.onrender.com/health`
Should see: `{"status":"ok",...}`

### Test 2: Web Interface
Visit: `https://your-url.onrender.com/`
Should see: Login page

### Test 3: Dashboard
1. Register with master code: `IITJPM2025`
2. Login and create a poll
3. Visit: `https://your-url.onrender.com/dashboard.html`

### Test 4: ESP32
1. Power on ESP32
2. Check Serial Monitor (115200 baud)
3. Should connect to WiFi and show "Enter Code:"
4. Test with code: `DDDDDD`

---

## 📋 Default Credentials

### Student Codes (for ESP32):
- `DDDDDD` → Shaurya Dwivedi
- `BBBBBB` → Samruddha Jadhav  
- `AAAAAA` → Atharva Ajmera
- `CCCCCC` → Kushagra Khare
- `ABCDDD` → Kunal Singh

### Instructor Access:
- Create account with master code: `IITJPM2025`

---

## 🔧 Important Notes

### ⚠️ Render Free Tier
- Server sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Perfect for testing and demos
- Upgrade to paid for production use

### 🔒 Security
- Change master code in `public/index.html` (line 112)
- Update student codes in `server.js` (lines 17-23)
- Consider adding database for production

### 📱 Access URLs
After deployment, you'll have:
- **Main App**: `https://your-url.onrender.com/`
- **Dashboard**: `https://your-url.onrender.com/dashboard.html`
- **API**: `https://your-url.onrender.com/poll`, `/vote`, etc.

---

## 🐛 Troubleshooting

### ESP32 won't connect:
- Check WiFi credentials
- Verify server URL (use `https://`, no trailing slash)
- Open Serial Monitor at 115200 baud
- Check Render logs for incoming requests

### Dashboard not loading:
- Check browser console (F12)
- Verify Render service is running
- Check CORS settings in `server.js`

### Poll not appearing:
- Ensure poll is started from dashboard
- Check ESP32 serial monitor for errors
- Test `/poll` endpoint in browser

---

## 📚 Additional Documentation

- **Full Deployment Guide**: `README_DEPLOYMENT.md`
- **Configuration Details**: `CONFIG.md`
- **Original README**: `README.md`

---

## 🎉 You're All Set!

Your polling system is now cloud-ready! Follow the 3 steps above and you'll be live in 10 minutes.

**Need Help?** Check the troubleshooting section or detailed guides in the other documentation files.
