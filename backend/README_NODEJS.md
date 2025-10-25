# 🚀 IntownLocal Backend - Node.js Setup Guide

Complete step-by-step guide to run the IntownLocal backend on your local machine after cloning from GitHub.

---

## 📋 Prerequisites

Before starting, ensure you have these installed:

### Required Software:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm or yarn** (comes with Node.js)
   - Verify npm: `npm --version`
   - Install yarn (optional): `npm install -g yarn`

3. **MongoDB** (Optional - backend works without it)
   - Download: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

4. **Git**
   - Download: https://git-scm.com/

---

## 🔧 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
# Clone your GitHub repository
git clone <your-github-repo-url>

# Navigate to project directory
cd <your-repo-name>

# Navigate to backend directory
cd backend
```

---

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# OR using yarn
yarn install
```

**Expected Output:**
```
✅ Added X packages in Xs
```

**Installed Packages:**
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `mongodb` - MongoDB driver
- `dotenv` - Environment variables
- `uuid` - Generate unique IDs
- `nodemon` - Development auto-reload (dev dependency)

---

### Step 3: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Create .env file
touch .env

# OR on Windows
type nul > .env
```

**Add the following content to `.env`:**

```env
# Server Configuration
PORT=8001

# MongoDB Configuration (Optional)
MONGO_URL=mongodb://localhost:27017
DB_NAME=intownlocal

# If using MongoDB Atlas (cloud), use this format:
# MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
```

**Note:** 
- The backend works **WITHOUT MongoDB** - it uses in-memory storage for testing
- MongoDB is only needed if you want persistent data storage

---

### Step 4: Start MongoDB (Optional)

#### If you have MongoDB installed locally:

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

**Windows:**
```bash
# MongoDB starts automatically as a service
# Or manually start from Services app
# Or run: net start MongoDB
```

**Verify MongoDB is running:**
```bash
# Check if MongoDB is accessible
mongosh
# OR
mongo

# You should see: "MongoDB shell version..."
```

#### If you DON'T have MongoDB:
**No problem!** The backend will run without it and use in-memory storage.

You'll see this message:
```
⚠️  Running without database - using in-memory storage
```

---

### Step 5: Start the Backend Server

```bash
# Production mode
npm start

# OR Development mode (auto-restarts on file changes)
npm run dev

# OR using yarn
yarn start
# or
yarn dev
```

**Expected Output:**
```
✅ Connected to MongoDB successfully
(or)
⚠️  Running without database - using in-memory storage

🚀 ========================================
✅ IntownLocal Backend Server Running!
📡 Port: 8001
🌐 Local: http://localhost:8001
🔗 Health: http://localhost:8001/health
🚀 ========================================
```

---

### Step 6: Test the Backend

#### Test 1: Health Check
```bash
# Open browser or use curl
curl http://localhost:8001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

#### Test 2: Get Categories
```bash
curl http://localhost:8001/api/categories
```

**Expected Response:**
```json
[
  {"id": "cat1", "name": "Grocery", "icon": "cart"},
  {"id": "cat2", "name": "Salon", "icon": "cut"},
  ...
]
```

#### Test 3: Get Plans
```bash
curl http://localhost:8001/api/plans
```

**Expected Response:**
```json
[
  {
    "id": "plan1",
    "name": "IT Max",
    "pricePerMonth": 299,
    ...
  }
]
```

#### Test 4: Send OTP
```bash
curl -X POST http://localhost:8001/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to 9876543210. Use 1234 for testing."
}
```

---

## 🌐 API Endpoints Reference

### Base URL: `http://localhost:8001`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/send-otp` | Send OTP to phone |
| POST | `/api/verify-otp` | Verify OTP and login |
| GET | `/api/shops?lat=X&lng=Y` | Get nearby shops |
| GET | `/api/plans` | Get subscription plans |
| GET | `/api/categories` | Get shop categories |
| POST | `/api/payment` | Process payment |
| POST | `/api/customer` | Register as member |
| POST | `/api/merchant` | Register as merchant |

---

## 🔥 Troubleshooting

### Issue 1: Port 8001 already in use

**Error:** `EADDRINUSE: address already in use :::8001`

**Solution:**
```bash
# Find process using port 8001
# macOS/Linux:
lsof -i :8001

# Windows:
netstat -ano | findstr :8001

# Kill the process
# macOS/Linux:
kill -9 <PID>

# Windows:
taskkill /PID <PID> /F
```

**OR change the port in `.env`:**
```env
PORT=8002
```

---

### Issue 2: Module not found errors

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
rm package-lock.json  # or yarn.lock

npm install
# or
yarn install
```

---

### Issue 3: MongoDB connection error

**Error:** `MongoServerError: Authentication failed`

**Solutions:**

1. **Running without MongoDB:**
   - Backend will automatically work without MongoDB
   - Comment out or remove `MONGO_URL` from `.env`

2. **Fix MongoDB connection:**
   ```bash
   # Check if MongoDB is running
   ps aux | grep mongod
   
   # Restart MongoDB
   brew services restart mongodb-community  # macOS
   sudo systemctl restart mongod            # Linux
   ```

3. **Use MongoDB Atlas (cloud):**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get connection string
   - Update `.env` with the connection string

---

### Issue 4: Cannot access from phone

**Problem:** Phone can't connect to `http://localhost:8001`

**Solution:** Use your computer's local IP address

```bash
# Find your local IP address

# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig

# Look for IPv4 Address: 192.168.X.X
```

**Update frontend `.env`:**
```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.X.X:8001
```

**Make sure:**
- Phone and computer are on the same WiFi network
- Firewall allows connections on port 8001

---

### Issue 5: CORS errors

**Error:** `Access-Control-Allow-Origin error`

**Solution:** The backend already has CORS enabled. If you still see errors:

1. Check if backend is running
2. Verify the frontend is using correct backend URL
3. Clear browser cache

---

## 📁 Project Structure

```
backend/
├── server.js           # Main server file (Node.js/Express)
├── package.json        # Node dependencies
├── .env               # Environment variables
├── node_modules/      # Installed packages (auto-generated)
└── README_NODEJS.md   # This file
```

---

## 🔄 Development Workflow

### Making Changes

1. **Edit `server.js`**
2. **Save the file**
3. **If using `npm run dev`:** Server auto-restarts
4. **If using `npm start`:** Manually restart with Ctrl+C, then `npm start`

### Testing Changes

```bash
# Test API endpoint
curl http://localhost:8001/api/categories

# Or use Postman/Insomnia
```

### Viewing Logs

```bash
# Logs appear in the terminal where you ran npm start
# Look for:
# ✅ Success messages
# ❌ Error messages
# 📱 API request logs
```

---

## 🛑 Stopping the Server

```bash
# Press Ctrl+C in the terminal
# The server will gracefully shut down
```

---

## 🚀 Next Steps

**Backend is running! ✅**

Now you can:

1. **Run the Frontend:**
   ```bash
   cd ../frontend
   yarn install
   yarn start
   ```

2. **Test the Full App:**
   - Scan QR code with Expo Go
   - Login with any 10-digit phone
   - Use OTP: 1234
   - Test Member/Merchant registration
   - Test logout functionality

3. **Develop New Features:**
   - Add new API endpoints
   - Integrate real SMS service
   - Add authentication middleware
   - Connect to real payment gateway

---

## 📚 Additional Resources

- **Express.js Docs:** https://expressjs.com/
- **MongoDB Docs:** https://www.mongodb.com/docs/
- **Node.js Docs:** https://nodejs.org/docs/

---

## 💡 Quick Tips

✅ **Use `nodemon` for development** - auto-restarts on file changes  
✅ **MongoDB is optional** - backend works without it  
✅ **Check logs** - all errors appear in terminal  
✅ **Test with `curl`** - quick way to verify endpoints  
✅ **Use Postman** - better for complex API testing  

---

## 🎉 Success!

If you see:
```
🚀 IntownLocal Backend Server Running!
📡 Port: 8001
🌐 Local: http://localhost:8001
```

**Your backend is ready! 🎊**

Need help? Check the troubleshooting section or reach out for support!
