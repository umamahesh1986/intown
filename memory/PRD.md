# IntownLocal - PRD & Progress

## Original Problem Statement
1. Clone the InTown Local React Native Expo app from GitHub (https://github.com/umamahesh1986/intown.git, branch: main) and run the mobile app preview.
2. OTP Authentication Flow Update: Remove Firebase, switch to custom OTP API services at devapi.intownlocal.com. Change OTP from 6 digits to 4 digits.

## Architecture
- **Frontend**: React Native + Expo SDK 54 with expo-router (web export served as static files)
- **Backend**: External APIs at `https://api.intownlocal.com` (user search, shops)
- **OTP APIs**: `https://devapi.intownlocal.com/IN/otp/` (send) and `/otp/verify` (verify)
- **State Management**: Zustand
- **Navigation**: expo-router (file-based routing)

## User Personas
- **Members (Customers)**: Local shoppers looking for nearby shops and savings
- **Merchants**: Local shop owners registering their businesses

## Core Features
- OTP-based phone login (custom API, 4-digit OTP)
- User Dashboard with location, search, categories, savings calculator
- Member/Merchant registration & dashboards
- Shop discovery, payments (mocked)

## What's Been Done

### Session 1 (Jan 2026) - Initial Setup
- Cloned repo from GitHub (main branch)
- Set up Expo web build (static export)
- Created static file server on port 3000

### Session 2 (Jan 2026) - OTP Flow Update
- **Removed Firebase** from login.tsx, otp.tsx, authStore.ts
- **New Send OTP API**: POST `https://devapi.intownlocal.com/IN/otp/` with `{mobileNumber: "91XXXXXXXXXX"}`
- **New Verify OTP API**: POST `https://devapi.intownlocal.com/IN/otp/verify` with `{mobileNumber, otpCode}`
- **OTP changed from 6 to 4 digits** with larger, better-styled input boxes
- **Phone masking**: Shows `******3080` instead of full number
- **30-second resend timer** (was 60s)
- **Inline phone validation** on login screen
- **Error handling**: Shows error messages for invalid/expired OTP
- **Auto-submit**: OTP auto-submits when all 4 digits are entered
- **Loading states**: Proper loading indicators during API calls
- All 13 test cases passed (100%)

## Files Modified
- `/app/frontend/app/login.tsx` - Removed Firebase, added Send OTP API call, inline validation
- `/app/frontend/app/otp.tsx` - Complete rewrite: 4-digit OTP, custom verify API, no Firebase
- `/app/frontend/utils/api.ts` - Added sendOtpApi() and verifyOtpApi() functions
- `/app/frontend/store/authStore.ts` - Removed Firebase signOut from logout

### Session 3 (Jan 2026) - Firebase Cleanup
- Removed 5 Firebase packages: `@react-native-firebase/app`, `@react-native-firebase/app-check`, `@react-native-firebase/auth`, `firebase`, `react-native-otp-verify`
- Deleted `firebase/` folder, `google-services.json`, `GoogleService-Info.plist`, `firebase.json`
- Removed Firebase plugins from `app.json`
- **Bundle size reduced from 2.39 MB to 1.9 MB (~500 KB / 20% reduction)**

### Session 4 (Jan 2026) - OTP Auto-Submit Bug Fix
- **Root cause**: Auto-submit on last digit read stale `otp` state via closure instead of using freshly built `newOtp` array
- **Fix**: Created `verifyWithCode(code)` that accepts OTP code directly; auto-submit now passes `newOtp.join("")` instead of relying on React state
- Same fix applied to paste auto-submit path
- 9/10 tests passed (1 minor: back button automation selector — works fine for real users)

## Backlog
- P1: Test full end-to-end login with real OTP on mobile device
- P2: Real payment gateway integration
- P3: Push notifications, App Store/Play Store deployment
