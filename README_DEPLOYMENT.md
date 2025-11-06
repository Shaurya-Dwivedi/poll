# 🚀 Deployment Guide for Polling-Meter

## Overview
This guide will help you deploy the Polling-Meter system to Render.com and configure your ESP32 devices.

## 📋 Prerequisites
- GitHub account
- Render.com account (free tier available)
- Arduino IDE with ESP32 board support
- Your ESP32 device

## 🌐 Step 1: Deploy Backend to Render

### Option A: Using GitHub (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [https://render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: polling-meter (or your choice)
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free
   - Click "Create Web Service"

3. **Note your deployment URL:**
   - After deployment, you'll get a URL like: `https://polling-meter-xxxx.onrender.com`
   - Save this URL - you'll need it for the next steps

### Option B: Manual Deployment

If you don't want to use GitHub:
1. On Render, select "Deploy from Git" and choose "Public Repository"
2. Follow the same configuration steps above

## 🔧 Step 2: Update Arduino ESP32 Code

1. Open `esp_code.ino` in Arduino IDE
2. Find this line (around line 7):
   ```cpp
   const String server = "http://192.168.216.57:3000";
   ```

3. Replace it with your Render URL (NO trailing slash):
   ```cpp
   const String server = "https://polling-meter-xxxx.onrender.com";
   ```

4. Update WiFi credentials if needed:
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

5. Upload the updated code to your ESP32

## 🖥️ Step 3: Update Frontend Dashboard

The dashboard URL is already configured to work with the backend. However, if you want to access it:

1. **Access the dashboard at:**
   - `https://your-render-url.onrender.com/` (login page)
   - `https://your-render-url.onrender.com/dashboard.html` (instructor dashboard)

2. **Update `dashboard.html` if needed:**
   - Open `public/dashboard.html`
   - Find line 91: `const server = "http://localhost:3000";`
   - Change to: `const server = "";` (empty string uses same domain)
   - Or use relative URLs by replacing `${server}/endpoint` with `/endpoint`

## ⚙️ Step 4: Configure Environment Variables (Optional)

On Render dashboard:
1. Go to your service → "Environment"
2. Add variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (Render sets this automatically)

## 🧪 Step 5: Test Your Deployment

1. **Test Health Endpoint:**
   - Visit: `https://your-render-url.onrender.com/health`
   - Should return: `{"status":"ok", ...}`

2. **Test Web Interface:**
   - Visit: `https://your-render-url.onrender.com/`
   - Try logging in (use master code: `XAI2025`)

3. **Test ESP32:**
   - Power on your ESP32
   - It should connect and show "Enter Code:" on LCD
   - Enter a student code using buttons

## 📝 Important Notes

### Free Tier Limitations
- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds to wake up
- For production use, consider upgrading to paid tier

### Data Persistence
- Current implementation uses in-memory storage
- Data resets when server restarts
- For permanent storage, consider adding a database (MongoDB, PostgreSQL)

### Security Considerations
- Student codes are hardcoded in `server.js`
- Master code is in `index.html`
- For production, consider:
  - Moving to environment variables
  - Using proper authentication (JWT)
  - Adding a database for user management

## 🔒 Security Best Practices

1. **Don't commit sensitive data:**
   - Add `.env` to `.gitignore`
   - Use Render's environment variables for secrets

2. **Update CORS settings:**
   - In `server.js`, replace `origin: '*'` with your specific domain

3. **Change default credentials:**
   - Update student codes in `server.js`
   - Update master code in `index.html`

## 🐛 Troubleshooting

### ESP32 won't connect:
- Check WiFi credentials
- Verify server URL (no trailing slash, use `https://`)
- Check Render logs for incoming requests

### Dashboard not loading:
- Check browser console for errors
- Verify CORS settings
- Check Render deployment logs

### Poll not appearing on ESP32:
- Ensure poll is started from dashboard
- Check `/poll` endpoint in browser
- Verify ESP32 serial monitor for errors

## 📊 Monitoring

- **Render Logs**: Check your service logs in Render dashboard
- **ESP32 Serial Monitor**: Use Arduino IDE to debug ESP32 (115200 baud)
- **Browser Console**: Use developer tools to debug frontend

## 🚀 Next Steps

After successful deployment:
1. Test full workflow: Login → Create Poll → Vote → View Results
2. Consider adding database for persistence
3. Implement proper authentication
4. Add more features as needed

## 💡 Tips

- Keep your Render URL handy
- Bookmark your dashboard
- Test with one ESP32 first before deploying to multiple devices
- Monitor Render logs during initial testing

## 📞 Support

If you encounter issues:
1. Check Render logs
2. Check ESP32 serial monitor
3. Verify all URLs are correct
4. Ensure WiFi connectivity

---

**Ready to deploy? Follow the steps above and your polling system will be live!** 🎉
