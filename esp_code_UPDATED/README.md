# ESP32 Configuration Setup

## 🔒 Security Setup for WiFi Credentials

To protect your WiFi credentials from being exposed in git, follow these steps:

### 1. Copy the config template
```bash
cp config.h.example config.h
```

### 2. Edit your config.h file
Open `config.h` and replace the placeholder values with your actual credentials:

```cpp
// Enterprise WiFi Configuration (for IITJ_WLAN)
const char* WIFI_SSID = "IITJ_WLAN";
const char* WIFI_USERNAME = "YOUR_ACTUAL_USERNAME";  // e.g., "b24es1032"
const char* WIFI_PASSWORD = "YOUR_ACTUAL_PASSWORD";  // e.g., "your_password_here"
```

### 3. Server URL Configuration
Also update the server URL in `config.h`:
```cpp
const char* SERVER_URL = "https://your-actual-server.onrender.com";
```

## 📁 File Structure

- `esp_code_UPDATED.ino` - Main ESP32 code
- `config.h.example` - Template file (safe to commit)
- `config.h` - Your actual config (ignored by git)
- `README.md` - This file

## ⚠️ Important Notes

1. **Never commit `config.h`** - It contains sensitive credentials
2. **Always use `config.h.example`** - For sharing template configurations
3. **Keep credentials secure** - Don't share them in chat/email/screenshots

## 🛠️ WiFi Types Supported

### Enterprise WiFi (WPA2-Enterprise)
Used for institutional networks like IITJ_WLAN:
```cpp
#define USE_ENTERPRISE_WIFI true
```

### Regular WiFi (WPA2-PSK)  
Used for home/personal networks:
```cpp
#define USE_ENTERPRISE_WIFI false
```

## 🚀 Quick Start

1. Copy `config.h.example` to `config.h`
2. Fill in your actual credentials
3. Upload to ESP32
4. Your credentials stay private! 🔒