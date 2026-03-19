# InTown Local - Product Requirements Document

## Original Problem Statement
Build and maintain a local shopping and savings mobile app (Expo/React Native) targeting Android via Google Play Store. The app features multiple user roles (user, member, merchant, dual), Firebase phone authentication, UPI payment integration, and connection to a proprietary backend API.

## Core Architecture
- **Framework**: Expo (React Native) with file-based routing (`expo-router`)
- **Authentication**: Firebase Phone Auth (`@react-native-firebase/auth`)
- **State Management**: Zustand
- **API**: External REST API at `https://api.intownlocal.com`
- **Deployment**: EAS Build for native Android, static web export for preview
- **Database**: None (API-driven)

## Key Files
- `/frontend/app/otp.tsx` — Phone auth with test OTP (web) / real Firebase OTP (mobile)
- `/frontend/components/PaymentModal.tsx` — UPI payment with direct app launch via `expo-intent-launcher`
- `/frontend/components/CommonBottomTabs.tsx` — Bottom navigation with safe area insets
- `/frontend/google-services.json` — Firebase config (both SHA-1 hashes)
- `/frontend/android/app/google-services.json` — Firebase config for native build
- `/frontend/android/app/src/main/AndroidManifest.xml` — Package queries for UPI apps
- `/frontend/firebase.json` — Firebase native config
- `/frontend/plugins/withUpiQueries.js` — Expo plugin for UPI app queries

## What's Been Implemented

### Authentication
- Split auth: test OTP (`123456`) on web, real Firebase Phone Auth on mobile
- `google-services.json` updated with both SHA-1 hashes (upload key + app signing key)
- `firebase.json` with `auth_android_phone_auto_verify_enabled: true`
- Removed `auth.settings` manipulation that could interfere with Play Integrity
- Fixed `forceResend` parameter: `false` on first call, `true` only on resend
- **Auto OTP Detection (Android)**: Firebase reads SMS silently and auto-verifies. Uses `onAuthStateChanged` listener to detect auto-verification. When detected, skips manual OTP entry and proceeds directly to login. Shows "OTP auto-detected! Logging you in..." UI indicator. Falls back to manual entry if auto-detect times out.

### UPI Payment Deep Links
- `PaymentModal.tsx` uses `Linking.openURL` with Android intent URIs to target specific UPI apps
- Intent URI format: `intent://pay?params#Intent;scheme=upi;package=com.app.name;end`
- This directly opens the selected app without showing a system chooser
- Fallback chain: intent URI → app-specific scheme → generic UPI chooser
- **Dynamic App Detection**: Detects installed UPI apps (PhonePe, GPay, Paytm, Amazon Pay, BHIM, CRED, iMobile Pay, Axis Mobile, IDFC FIRST Bank) using `Linking.canOpenURL` with intent URIs and scheme checks
- Shows only installed apps + Cash fallback
- `AndroidManifest.xml` updated with `<queries>` for all 9 UPI app packages (Android 11+ package visibility)
- Expo config plugin `withUpiQueries.js` persists queries across rebuilds
- **REMOVED** `upi` intent filter from `app.json` to prevent IntownLocal from appearing as a UPI handler in Android chooser
- **REMOVED** `expo-intent-launcher` dependency (was causing "Something went wrong" errors); replaced with `Linking.openURL`

### UI/UX Fixes (Previous Sessions)
- Dynamic profile images in headers across all dashboards
- Bottom tab safe area handling with `react-native-safe-area-context`
- KeyboardAvoidingView in payment modal
- Full-screen carousel image modal
- Updated payment modal labels with "Intown Savings" field

### Bug Fixes (Previous Sessions)
- Fixed savings display showing '0' by using correct API field names
- Fixed UPI deep links with `expo-intent-launcher`
- Fixed merchant registration saving custom products
- Fixed category images using `imageUrl` from API
- Fixed "Update Profile Image" button on account page
- Fixed blank white screen on local dev (deleted conflicting `public/index.html`)

## Pending Issues

### P0: Firebase reCAPTCHA on Production Android
- **Status**: Code fixes applied, awaiting user verification on new build
- **Root cause**: Likely Play Integrity API propagation delay (just enabled)
- **Code fixes done**: 
  - Both SHA-1 hashes in `google-services.json`
  - `firebase.json` with auto-verify enabled
  - Removed `auth.settings` interference
  - Fixed `forceResend` parameter
- **User action needed**: 
  - Verify Play Integrity API is enabled in Google Cloud Console
  - Check API key restrictions
  - Rebuild and test (may need 30min-few hours for API propagation)

### P0: UPI Payment Flow
- **Status**: FIXED — Simplified to use native Android UPI chooser
- **What changed**: After clicking OK on success modal, `Linking.openURL('upi://pay?...')` is called directly, which opens the native Android "Open with" dialog showing all installed UPI apps. No custom modal.
- **Code fixes done**:
  - Removed `upi` intent filter from `app.json` (prevents IntownLocal from appearing in chooser)
  - Removed `expo-intent-launcher` dependency
  - Simplified `PaymentModal.tsx` — OK click → `Linking.openURL` → native chooser → app opens
  - Updated `withUpiQueries.js` plugin with 9 UPI app packages for Android 11+ visibility
- **User action needed**: Run `npx expo prebuild --clean` then `eas build` and test on device

### P1: EAS Build Failure
- **Status**: Build config updated, awaiting user retry
- **Fixes**: Disabled npm cache in `eas.json`, removed duplicate deps from `devDependencies`

### P1: Merchant Login Crash (App closes on merchant login)
- **Status**: FIXED — Code updated, awaiting user build + device test
- **Root causes found and fixed**:
  1. `setUser()` and `setToken()` were async but NOT awaited before `router.replace()` — dashboard mounted with `user = null`
  2. `merchantId` not passed as route param — only `userType` was passed
  3. Merchant data not stored to AsyncStorage before navigation (race condition)
  4. Invalid web-only CSS properties in native StyleSheet (`whiteSpace`, `textOverflow`)
- **Code files changed**: `otp.tsx`, `merchant-dashboard.tsx`, `member-dashboard.tsx`
- **User action needed**: Run `npx expo prebuild --clean` then `eas build` and test merchant login

## Build Configuration
- `eas.json` — Added `EAS_BUILD_DISABLE_NPM_CACHE` for preview and production
- `package.json` — Removed duplicate `react`/`react-dom` from devDependencies

## 3rd Party Integrations
- **Firebase**: Phone authentication via `@react-native-firebase/auth` v23.8.5
- **External API**: `https://api.intownlocal.com` for all data operations

## Known Limitations
- Web preview has CORS issues (expected, API works on native)
- Web uses mock OTP (`123456`) and local profile image storage

## Future/Backlog
- Refactor dashboard components into reusable `DashboardLayout`
- Consolidate TypeScript interfaces into central `types` directory
