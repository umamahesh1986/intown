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
- [x] **OTP crash fix v2**: Comprehensive fix for new user crash (Feb 2026)

### OTP Crash Fix v2 Details (Feb 2026)
**Reported Issue**: New users crash instantly after OTP auto-select on Android ("IntownLocal keeps stopping"). Existing users work fine.

**Root Cause Analysis**: Multiple potential native crash vectors:
1. **Double confirm()**: Firebase silently auto-verifies the phone (SIM match), then SMS auto-read also calls `confirmationResult.confirm()` on the already-verified session → native Firebase SDK crash
2. **State updates after unmount**: SMS listener fires after component has navigated away → `.focus()` on disposed native TextInput
3. **Multiple removeOtpListener calls**: Native module crash from removing already-removed listener

**Fixes Applied** (in `/app/frontend/app/otp.tsx`):
1. **Check `auth().currentUser` before `confirm()`** — if Firebase already verified, skip `confirm()` and use existing user directly (prevents native crash from double-confirm)
2. **Mounted ref guard** (`isMountedRef`) — all state updates check if component is still mounted
3. **Single-use SMS cleanup** (`smsListenerActive` ref + `cleanupSmsListener()`) — ensures `removeOtpListener` is called exactly once, not multiple times
4. **Auto-verify recovery** — if `confirm()` fails because session already verified, recovers by checking `auth().currentUser`
5. **300ms navigation delay** — lets React state flush before triggering native navigation
6. **ErrorBoundary** wrapped around `user-dashboard` component

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
- `/app/frontend/app/otp.tsx` - OTP verification with comprehensive crash prevention
- `/app/frontend/components/PaymentModal.tsx` - Payment flow with UPI/Cash chooser
- `/app/frontend/components/ErrorBoundary.tsx` - Error boundary for crash recovery
- `/app/frontend/app/user-dashboard.tsx` - User dashboard (wrapped in ErrorBoundary)
- `/app/frontend/app/member-shop-details.tsx` - Shop details page
- `/app/frontend/app/merchant-dashboard.tsx` - Merchant dashboard
- `/app/frontend/app/dual-dashboard.tsx` - Dual dashboard
- `/app/frontend/app/member-dashboard.tsx` - Member dashboard
- `/app/frontend/utils/api.ts` - API utilities and user role determination
- `/app/frontend/google-services.json` - Android Firebase config
- `/app/frontend/GoogleService-Info.plist` - iOS Firebase config
