# InTown - Product Requirements Document

## Original Problem Statement
Build, run, and fix critical issues in the Expo (React Native) mobile app "InTown" for Android, with preparation for iOS release.

## Architecture
- **Framework**: Expo (React Native)
- **Project Root**: `/app/frontend`
- **Routing**: expo-router
- **State Management**: Zustand
- **Auth**: Firebase Phone Auth
- **External API**: `https://api.intownlocal.com`

## What's Been Implemented

### Completed
- [x] Merchant crash fix: `.toFixed()` null guards on all dashboards
- [x] Firebase Auth diagnosis: SHA-1/SHA-256 fingerprints guidance
- [x] API endpoint fix: corrected GET request in merchant-dashboard
- [x] iOS setup: `GoogleService-Info.plist` created
- [x] UPI flow: AppState-based redirect (waits for user to return from UPI app)
- [x] UI fix: layout gap at bottom of payment modal
- [x] Payment method chooser: "Pay with" screen with UPI and Cash options
- [x] UPI fix: Open UPI app generically (`upi://pay`) when no merchant VPA
- [x] **OTP crash fix**: Fixed race condition between Firebase auto-verify and SMS auto-read that caused native crash on new devices (Feb 2026)

### OTP Flow Fix Details (Feb 2026)
**Root Cause**: When a new user logs in on a new device, Firebase silently auto-verifies the phone (SIM matches phone number). Simultaneously, the SMS arrives and `react-native-otp-verify` fires. Both paths tried to process the user concurrently, causing `.focus()` to be called on a disposing native TextInput, resulting in a native crash ("IntownLocal keeps stopping").

**Fix Applied** (in `/app/frontend/app/otp.tsx`):
1. SMS listener callback now checks `hasProcessedAuth.current` BEFORE touching any state/refs
2. `processVerifiedUser` now cleans up SMS listener (`removeOtpListener`) immediately
3. `autoSubmitOtp` now cleans up SMS listener before calling `.confirm()`
4. Auto-verify listener (`onAuthStateChanged`) now cleans up SMS listener when it fires
5. All `setTimeout` callbacks guarded with `hasProcessedAuth.current` check
6. Error handlers in `autoSubmitOtp` guarded against state updates after unmount

### Payment Flow (Current)
1. User enters amounts and clicks Submit
2. API call records transaction
3. Success screen appears, user clicks OK
4. "Pay with" chooser appears with two options:
   - **UPI**: Opens native UPI app chooser via `upi://pay`. User enters payee manually. AppState redirects to dashboard on return.
   - **Cash**: Redirects directly to dashboard

## Pending User Verification
- OTP crash fix for new users (requires APK build + real device)
- UPI payment flow (requires APK build + real device)
- Firebase Auth fix (requires Play Store build)
- Merchant login crash fix (requires APK build)

## Backlog
- P1: iOS deployment (Apple Developer account, certs, EAS Build)
- P2: Refactor dashboards into reusable DashboardLayout
- P2: Consolidate TypeScript interfaces into central types directory

## Key Files
- `/app/frontend/app/otp.tsx` - OTP verification with race condition fix
- `/app/frontend/components/PaymentModal.tsx` - Payment flow with UPI/Cash chooser
- `/app/frontend/app/member-shop-details.tsx` - Shop details page
- `/app/frontend/app/merchant-dashboard.tsx` - Merchant dashboard
- `/app/frontend/app/dual-dashboard.tsx` - Dual dashboard
- `/app/frontend/app/member-dashboard.tsx` - Member dashboard
- `/app/frontend/utils/api.ts` - API utilities and user role determination
- `/app/frontend/google-services.json` - Android Firebase config
- `/app/frontend/GoogleService-Info.plist` - iOS Firebase config
