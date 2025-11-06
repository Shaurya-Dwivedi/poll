# 🗄️ MongoDB Atlas Setup Guide

## Step-by-Step Instructions

Follow these steps to set up your free MongoDB database for the Polling-Meter project.

---

## 📋 Prerequisites

- Email address for MongoDB Atlas account
- Internet connection
- 10 minutes of time

---

## 🚀 Step 1: Create MongoDB Atlas Account

1. **Go to MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register

2. **Sign Up**:
   - Click "Try Free"
   - Choose sign-up method:
     - Email + Password (recommended)
     - Google account
     - GitHub account

3. **Complete Registration**:
   - Fill in your details
   - Agree to terms of service
   - Verify your email if required

4. **Answer Welcome Questions** (optional):
   - Select "Building a new application"
   - Select "Node.js"
   - You can skip these if you want

---

## 🏗️ Step 2: Create a Free Cluster

1. **Choose Deployment Option**:
   - Select **"M0 Free"** (Shared cluster)
   - This gives you 512MB storage (plenty for this project)

2. **Select Cloud Provider & Region**:
   - **Provider**: AWS (recommended)
   - **Region**: Choose closest to your location
     - India: Mumbai (ap-south-1)
     - USA East: N. Virginia (us-east-1)
     - Europe: Frankfurt (eu-central-1)
   - Click "Create"

3. **Wait for Cluster Creation**:
   - Takes 3-5 minutes
   - You'll see "Your cluster is being created..."

---

## 🔐 Step 3: Create Database User

1. **Security Quickstart** will appear:

2. **Create Database User**:
   - **Username**: Choose a username (e.g., `pollingmeter_admin`)
   - **Password**: Click "Autogenerate Secure Password" or create your own
   - ⚠️ **IMPORTANT**: Copy and save the password securely!
   - Click "Create User"

3. **Save These Credentials**:
   ```
   Username: pollingmeter_admin
   Password: [YOUR_GENERATED_PASSWORD]
   ```

---

## 🌐 Step 4: Configure Network Access

1. **Add IP Address**:
   - Choose "My Local Environment"
   - For development: Click "Add My Current IP Address"
   - For Render deployment: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ For production, whitelist only Render's IP ranges

2. **Click "Finish and Close"**

3. **Click "Go to Databases"**

---

## 🔗 Step 5: Get Connection String

1. **On Database Deployments page**:
   - Find your cluster (usually named "Cluster0")
   - Click **"Connect"** button

2. **Choose Connection Method**:
   - Select **"Connect your application"**

3. **Copy Connection String**:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
   - You'll see a string like:
   ```
   mongodb+srv://pollingmeter_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Modify the Connection String**:
   - Replace `<password>` with your actual password
   - Add database name before the `?`:
   ```
   mongodb+srv://pollingmeter_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/polling_meter?retryWrites=true&w=majority
   ```

5. **Save This Connection String** - you'll need it next!

---

## ✅ Step 6: Verify Setup

Your MongoDB Atlas setup is complete when you have:

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster created and running
- [ ] Database user created with username and password
- [ ] Network access configured (IP whitelist)
- [ ] Connection string copied and modified

---

## 📝 What You Should Have Now

```
MongoDB Atlas Account: ✅
Cluster Name: Cluster0 (or your custom name)
Database Name: polling_meter
Username: pollingmeter_admin (or your username)
Password: [YOUR_SECURE_PASSWORD]
Connection String: mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/polling_meter?retryWrites=true&w=majority
```

---

## 🎯 Next Steps

Once you have your connection string:

1. **Update .env file** with your MongoDB connection string
2. **Install mongoose** package
3. **Connect to database** from server.js
4. **Create database models** for students, polls, attendance

I'll guide you through each of these steps next!

---

## ❓ Troubleshooting

### Issue: Can't connect to cluster
**Solution**: 
- Check network access settings
- Ensure IP address is whitelisted
- Verify username/password are correct

### Issue: "Authentication failed" error
**Solution**:
- Double-check password has no special characters that need URL encoding
- Try resetting database user password

### Issue: Connection timeout
**Solution**:
- Check firewall settings
- Ensure 0.0.0.0/0 is added to IP whitelist for development

### Issue: "MongoServerError: bad auth"
**Solution**:
- Password might contain special characters
- URL-encode special characters:
  - @ becomes %40
  - : becomes %3A
  - / becomes %2F

---

## 🔒 Security Best Practices

1. **Never commit connection string to Git**
   - Always use .env file
   - Add .env to .gitignore

2. **Use strong passwords**
   - Use auto-generated passwords
   - Never use common words

3. **Restrict IP access in production**
   - Only whitelist Render's IP ranges
   - Remove 0.0.0.0/0 in production

4. **Use environment variables**
   - On Render: Add MONGODB_URI in environment settings
   - Keep credentials out of code

---

## 📞 Need Help?

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- MongoDB University (Free Courses): https://university.mongodb.com/
- Community Forums: https://www.mongodb.com/community/forums/

---

**Ready?** Once you have your connection string, let me know and I'll proceed with Task 0.2! 🚀
