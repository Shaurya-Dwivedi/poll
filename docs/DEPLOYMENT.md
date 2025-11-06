# 🚀 Complete Deployment Guide

This guide consolidates all deployment information for the Polling-Meter project.

---

## 📋 Prerequisites

- GitHub account
- Render.com account (free tier available)
- MongoDB Atlas account (created - see [MONGODB_SETUP.md](MONGODB_SETUP.md))
- Arduino IDE with ESP32 support
- Your ESP32 device

---

## 🗄️ Step 1: Database Setup (Already Done ✅)

You've already completed:
- ✅ MongoDB Atlas account created
- ✅ Cluster created
- ✅ Database user configured
- ✅ Connection string obtained

If you need to set up MongoDB again, see [MONGODB_SETUP.md](MONGODB_SETUP.md).

---

## 🌐 Step 2: Deploy Backend to Render

### Option A: Using GitHub (Recommended)

1. **Push your code to GitHub:**
   ```bash
   cd Polling-Meter-main
   git init
   git add .
   git commit -m "Initial commit - Ready for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [https://render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `polling-meter` (or your choice)
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free
   
3. **Add Environment Variables:**
   - In Render dashboard, go to "Environment"
   - Add these variables:
     ```
     MONGODB_URI=mongodb+srv://polling_meter_admin:YOUR_PASSWORD@poll-database.5gfwuau.mongodb.net/polling_meter?retryWrites=true&w=majority
     PORT=3000
     NODE_ENV=production
     ```
   - Click "Save Changes"

4. **Deploy:**
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment

5. **Note your deployment URL:**
   - After deployment: `https://polling-meter-xxxx.onrender.com`
   - Save this URL!

---

## 🔧 Step 3: Update ESP32 Code

1. **Open Arduino Code:**
   - File: `esp_code/esp_code.ino`
   
2. **Update Configuration (Lines 10-14):**
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";          // Your WiFi SSID
   const char* password = "YOUR_WIFI_PASSWORD";  // Your WiFi password
   const String server = "https://polling-meter-xxxx.onrender.com";  // Your Render URL (NO trailing slash!)
   ```

3. **Upload to ESP32:**
   - Connect ESP32 via USB
   - Select correct board and port
   - Click Upload

4. **Verify:**
   - Open Serial Monitor (115200 baud)
   - Should see: "✅ WiFi Connected!" and "🌐 Server: [your-url]"

---

## 🖥️ Step 4: Access Dashboard

Your web interface is now live at:
- **Login Page**: `https://your-render-url.onrender.com/`
- **Dashboard**: `https://your-render-url.onrender.com/dashboard.html`

**Default Credentials:**
- Master registration code: `XAI2025`

---

## 🧪 Step 5: Test Everything

### Test 1: Health Check
```bash
curl https://your-render-url.onrender.com/health
```
Should return: `{"status":"ok",...}`

### Test 2: Web Interface
1. Visit your Render URL
2. Register with master code: `XAI2025`
3. Login
4. Create a test poll

### Test 3: ESP32
1. Power on ESP32
2. Enter student code (check server.js for valid codes)
3. Wait for poll to appear
4. Vote and verify results

---

## ⚙️ Configuration Reference

See [CONFIG.md](CONFIG.md) for all configuration options.

---

## 🔒 Security Checklist

Before going live:
- [ ] Change master code in `public/index.html`
- [ ] Update student database (see Step 6)
- [ ] Restrict CORS in server.js (replace `origin: '*'`)
- [ ] Use environment variables for all secrets
- [ ] Enable proper authentication

---

## 📊 Step 6: Update Student Database

Your student data is in: `server/models/students list/*.csv`

**To load students into database:**
1. We'll create a seed script (Task 0.7)
2. This will import all students from CSV
3. Students will be stored in MongoDB

*This step will be completed in Task 0.7 - coming soon!*

---

## 🐛 Troubleshooting

### Issue: Render deployment fails
**Solution:**
- Check build logs in Render dashboard
- Verify `package.json` has correct start script
- Ensure all dependencies are listed

### Issue: ESP32 can't connect
**Solution:**
- Verify WiFi credentials
- Check server URL (must be `https://`, no trailing slash)
- Check Serial Monitor for error messages
- Ensure network allows HTTPS requests

### Issue: Database connection error
**Solution:**
- Verify MONGODB_URI in Render environment variables
- Check MongoDB Atlas network access (IP whitelist)
- Ensure database user has correct permissions

### Issue: Server "sleeps" after 15 minutes
**Solution:**
- This is normal for Render free tier
- First request after sleep takes 30-60 seconds
- Consider upgrading to paid tier for always-on

---

## 📝 Important Notes

### Free Tier Limitations
- **Render**: Spins down after 15 min inactivity
- **MongoDB Atlas**: 512MB storage limit
- Both perfect for testing and demos!

### Data Persistence
- All data now stored in MongoDB
- Survives server restarts
- Permanent storage ✅

---

## 🚀 Next Steps

After successful deployment:
1. ✅ Test full workflow
2. ✅ Import your student list
3. ✅ Change default credentials
4. ✅ Configure attendance feature (coming soon!)
5. ✅ Monitor logs and performance

---

## 📞 Need Help?

- **Render Issues**: Check [render.com/docs](https://render.com/docs)
- **MongoDB Issues**: See [MONGODB_SETUP.md](MONGODB_SETUP.md)
- **ESP32 Issues**: Check Serial Monitor output
- **General Issues**: Review [TASKS.md](TASKS.md) for current status

---

**Ready to deploy?** Follow the steps above and you'll be live in 20 minutes! 🎉
