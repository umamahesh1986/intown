# 🚀 IntownLocal - Quick Start Guide (After Clone)

## ⚡ Super Quick Start (5 Minutes)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Start Backend (Node.js)
```bash
cd backend
npm install
npm start
```
✅ Backend running on **http://localhost:8001**

### 3. Start Frontend (in new terminal)
```bash
cd frontend
yarn install
yarn start
```
✅ Scan QR code with **Expo Go** app on your phone

### 4. Test the App
- Login with any 10-digit phone number
- Use OTP: **1234**
- Test Member/Merchant registration
- Test logout functionality

---

## 📱 What You Need

### On Your Computer:
- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)

### On Your Phone:
- **Expo Go App**
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Optional:
- **MongoDB** - Backend works without it!
  - [Download](https://www.mongodb.com/try/download/community) (optional)

---

## 📂 Project Structure

```
your-repo/
├── backend/              # Node.js + Express API
│   ├── server.js        # Main backend file
│   ├── package.json     # Dependencies
│   ├── .env            # Configuration
│   └── README_NODEJS.md # Detailed backend guide
│
├── frontend/            # Expo + React Native
│   ├── app/            # All screens
│   ├── store/          # State management
│   ├── package.json    # Dependencies
│   └── .env           # Configuration
│
└── QUICKSTART.md       # This file
```

---

## 🔧 Detailed Setup Instructions

### Backend Setup (Node.js)

```bash
# Step 1: Navigate to backend
cd backend

# Step 2: Install dependencies
npm install
# or
yarn install

# Step 3: Create .env file (optional)
# Create a file named .env with:
PORT=8001
MONGO_URL=mongodb://localhost:27017
DB_NAME=intownlocal

# Step 4: Start server
npm start
# or for auto-reload on changes:
npm run dev
```

**Expected Output:**
```
🚀 IntownLocal Backend Server Running!
📡 Port: 8001
🌐 Local: http://localhost:8001
```

**Test Backend:**
```bash
# Open in browser or use curl
curl http://localhost:8001/health

# Should return: {"status":"ok","message":"Backend is running"}
```

---

### Frontend Setup (Expo)

```bash
# Step 1: Open NEW terminal, navigate to frontend
cd frontend

# Step 2: Install dependencies
yarn install
# or
npm install

# Step 3: Verify .env file exists
# Should contain:
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001

# Step 4: Start Expo
yarn start
# or
npx expo start
```

**Expected Output:**
```
Metro waiting on exp://192.168.X.X:3000
QR Code appears in terminal
```

**Run on Phone:**
1. Open **Expo Go** app
2. **iOS:** Scan QR with Camera → Tap notification
3. **Android:** Tap "Scan QR Code" in Expo Go → Scan
4. App loads on your phone! 🎉

---

## 🧪 Testing the App

### 1. Login Flow
- Enter any **10-digit phone number** (e.g., 9876543210)
- Click "Send OTP"
- Enter OTP: **1234** (any 4-digit code works)
- Navigate to User Dashboard ✅

### 2. Member Registration
- Click **"IT Max"** or **"IT Max Plus"** plan
- Fill member registration form
- Submit → Member Dashboard ✅
- Test **Logout** → Should return to login ✅

### 3. Merchant Registration
- From User Dashboard, click **"Merchant Tab"**
- Fill merchant registration form
- Submit → Merchant Dashboard ✅
- Test **Logout** → Should return to login ✅

---

## 🐛 Common Issues & Solutions

### Issue 1: Cannot connect to backend from phone

**Problem:** Phone can't reach `http://localhost:8001`

**Solution:** Use your computer's IP address

```bash
# Find your IP address:
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig

# Example output: 192.168.1.100
```

**Update `frontend/.env`:**
```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001
```

**Make sure:**
- Phone and computer on same WiFi ✅
- Backend is running ✅
- Restart Expo after changing .env ✅

---

### Issue 2: Port 8001 already in use

**Solution:**
```bash
# Find and kill process using port 8001
# macOS/Linux:
lsof -i :8001
kill -9 <PID>

# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

---

### Issue 3: "Metro bundler" error

**Solution:**
```bash
cd frontend
yarn start --clear
# or
npx expo start --clear
```

---

### Issue 4: Module not found

**Solution:**
```bash
# Backend:
cd backend
rm -rf node_modules
npm install

# Frontend:
cd frontend
rm -rf node_modules
yarn install
```

---

## 📚 Detailed Documentation

- **Backend Setup:** See `backend/README_NODEJS.md`
- **Logout Fix:** See `LOGOUT_FIX_SUMMARY.md`
- **Testing:** See `test_result.md`

---

## 🎯 What's Working

✅ **Backend (Node.js + Express)**
- All API endpoints functional
- Works with or without MongoDB
- Mock OTP system (use: 1234)
- Member/Merchant registration
- Payment processing (mocked)

✅ **Frontend (Expo + React Native)**
- Splash screen
- Location permission
- OTP-based login
- User Dashboard
- Member registration & dashboard
- Merchant registration & dashboard
- **Logout functionality (FIXED!)**

✅ **Features**
- Popular categories
- Savings calculator
- Nearby shops (auto-scrolling)
- Shop details & navigation
- Payment flow (mocked)

---

## 🚀 Development Workflow

### Backend Changes:
```bash
# Edit backend/server.js
# If using npm run dev - auto-restarts
# If using npm start - manually restart
```

### Frontend Changes:
```bash
# Edit any file in frontend/app/
# Expo auto-reloads
# See changes immediately
```

---

## 🛑 Stopping Everything

```bash
# Stop backend - Press Ctrl+C in backend terminal
# Stop frontend - Press Ctrl+C in frontend terminal
# Stop MongoDB (if running) - brew services stop mongodb-community
```

---

## 💡 Pro Tips

✅ Use `npm run dev` in backend for auto-reload  
✅ Keep phone and computer on same WiFi  
✅ Use Postman to test API endpoints  
✅ Check terminal logs for errors  
✅ Clear cache if something breaks: `yarn start --clear`  

---

## 🎉 Success Checklist

- [ ] Backend running on http://localhost:8001
- [ ] Frontend showing QR code
- [ ] Expo Go app installed on phone
- [ ] Phone connected to same WiFi
- [ ] App loads on phone successfully
- [ ] Can login with any phone number
- [ ] OTP 1234 works
- [ ] User Dashboard visible
- [ ] Member/Merchant registration works
- [ ] Logout works correctly

**All checked? You're ready to develop! 🚀**

---

## 🆘 Need Help?

1. Check `backend/README_NODEJS.md` for detailed backend instructions
2. Check `LOGOUT_FIX_SUMMARY.md` for logout implementation
3. Review error messages in terminal
4. Ensure all prerequisites are installed
5. Verify WiFi connectivity

---

## 📝 Next Steps

**Now that everything is running:**

1. Customize the app UI/UX
2. Add real SMS integration
3. Connect to real payment gateway
4. Deploy to production
5. Publish to App Store / Play Store

Happy coding! 🎊
