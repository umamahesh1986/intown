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
- `PaymentModal.tsx` refactored with `openUpiApp()` using `expo-intent-launcher`
- Uses `ACTION_VIEW` with `upi://pay` URI + specific `packageName` per app
- `onSuccess()` moved out of `finally` block — only called when app actually opens
- `AndroidManifest.xml` updated with `<queries>` for all UPI apps (Android 11+ package visibility)
- Expo config plugin `withUpiQueries.js` to persist queries across rebuilds
- `app.json` includes UPI intent filters

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

### P0: UPI Apps Not Opening Directly
- **Status**: Code refactored per user's approach, awaiting build + test
- **Code fixes done**:
  - Replaced with clean `openUpiApp()` using `IntentLauncher.startActivityAsync`
  - Added `<queries>` to AndroidManifest for package visibility
  - Fixed `onSuccess` to only trigger when app actually opens
- **User action needed**: Build with EAS and test on device

### P1: EAS Build Failure
- **Status**: Build config updated, awaiting user retry
- **Fixes**: Disabled npm cache in `eas.json`, removed duplicate deps from `devDependencies`

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
