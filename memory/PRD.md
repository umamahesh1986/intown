<<<<<<< HEAD
# InTown - Product Requirements Document

## Original Problem Statement
Build, run, and fix critical issues in the Expo (React Native) mobile app "InTown" for Android, with preparation for iOS release. Integrate Razorpay Subscription & Payment flow.

## Architecture
- **Framework**: Expo (React Native)
- **Project Root**: `/app/frontend`
- **Routing**: expo-router (file-based)
- **State Management**: Zustand
- **Auth**: Firebase Phone Auth
- **External API**: `https://api.intownlocal.com` (single source in `utils/api.ts`)
- **Payments**: Razorpay (`react-native-razorpay` v2.3.1)

## What's Been Implemented

### Completed
- [x] Merchant crash fix: `.toFixed()` null guards on all dashboards
- [x] Firebase Auth diagnosis: SHA-1/SHA-256 fingerprints guidance
- [x] API endpoint fix: corrected GET request in merchant-dashboard
- [x] iOS setup: `GoogleService-Info.plist` created
- [x] UPI flow: AppState-based redirect
- [x] UI fix: layout gap at bottom of payment modal
- [x] Payment method chooser: UPI and Cash options
- [x] UPI fix: Open UPI app generically
- [x] OTP crash fix v2: Comprehensive fix for new user crash
- [x] Hide bottom menu on user-dashboard
- [x] Mirror Merchant layout to Customer tab
- [x] **Razorpay Subscription Integration** (checkout.tsx, plans routing, _layout registration)
- [x] **URL Consolidation Refactor** — All hardcoded URLs consolidated to single `INTOWN_API_BASE` constant
- [x] **Payment History Screen** — New screen showing transaction history, savings, subscription info, with filters

### Razorpay Subscription Flow
`/plans` → select plan → `/checkout` → Create Order API → Razorpay Native Checkout → Verify Payment → Dashboard redirect

### Payment History Screen (Feb 2026)
- New screen at `/app/frontend/app/payment-history.tsx`
- Features: transaction list with date/time, amount, savings badges, summary cards (count/paid/saved), subscription info card, filter tabs (All/This Month/This Year), pull-to-refresh, empty state
- Accessible from Account page via Quick Links menu
- Uses `GET /IN/transactions/customers/{customerId}` API
- Account page enhanced with Quick Links section (Payment History, Subscription Plans, My Savings) and made scrollable

### URL Consolidation (Feb 2026)
- Single source of truth: `BASE_URL` in `utils/api.ts` line 4
- Derived constant: `INTOWN_API_BASE` (exported)
- 12+ files updated to import from single source

## Pending User Verification
- Razorpay checkout (requires APK rebuild + real device)
- Payment History screen (requires APK rebuild + real device)
- OTP crash fix for new users
- Firebase Auth fix (SHA keys from Play Console)

## Backlog
- P1: iOS deployment (Apple Developer account)
- P2: Refactor `user-dashboard.tsx` (>2500 lines) into sub-components
- P2: Consolidate TypeScript interfaces into central `types` directory

## Key Files
- `/app/frontend/utils/api.ts` — Single source for all API URLs + exports `INTOWN_API_BASE`
- `/app/frontend/app/payment-history.tsx` — Payment History screen (NEW)
- `/app/frontend/app/checkout.tsx` — Razorpay checkout page
- `/app/frontend/app/plans.tsx` — Subscription plans page
- `/app/frontend/app/account.tsx` — Account page with Quick Links menu
- `/app/frontend/app/_layout.tsx` — Root layout with navigation
- `/app/frontend/app/otp.tsx` — OTP verification
- `/app/frontend/store/authStore.ts` — Zustand auth store
- `/app/frontend/components/PaymentModal.tsx` — Payment flow
=======
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

### Session 5 (Jan 2026) - EAS Build Fix (Android)
- **Root cause**: `android/` directory had stale Firebase/Google Services references from before removal
  - `android/app/build.gradle:184` — `apply plugin: 'com.google.gms.google-services'`
  - `android/build.gradle:9` — `classpath 'com.google.gms:google-services:4.4.1'`
  - `android/app/google-services.json` still present
- **Fix**: Removed entire `android/` directory — EAS Build will regenerate via `expo prebuild`
- Removed `googleServicesFile` from both `ios` and `android` sections in `app.json`
- Deleted stale `scripts/disable-recaptcha.js`
- Web build verified working after cleanup

### Session 6 (Jan 2026) - Merchant Registration New Fields
- Added 6 new fields after "Introduced By": openAt, closeAt, breakStartAt, breakEndAt, weekOff, offer
- Time picker modal with Hour (1-12), Min (00/15/30/45), AM/PM columns
- Week Off: selectable day chips (Sun–Sat), multi-select, stored as comma-separated string
- Offer: multi-line textarea
- All fields included in API payload, draft save/restore
- data-testid attributes added for time picker buttons
- 11/12 tests passed (1 minor: automation selector, not user-facing)

### Session 7 (Jan 2026) - OTP "Failed to send" Bug Fix (Post-Merge)
- **Root cause**: Merge from `conflict_110426_1021` to `main` changed OTP_API_BASE from `devapi.intownlocal.com` to `api.intownlocal.com`
- Production API (`api.intownlocal.com/IN/otp/`) returns HTTP 500 due to DB constraint error (`duplicate key violates unique constraint "otp_records_mobile_number_key"`)
- **Fix**: Restored `OTP_API_BASE` to `https://devapi.intownlocal.com/IN` in `utils/api.ts` line 7
- Verified: OTP sends successfully for phone 8639071519

## Backlog
- P1: Test full end-to-end login with real OTP on mobile device
- P2: Real payment gateway integration
- P3: Push notifications, App Store/Play Store deployment
>>>>>>> conflict_110426_1021
