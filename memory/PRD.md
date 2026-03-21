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
- [x] **Payment method chooser**: Added in-app "Pay with" screen after successful transaction with UPI and Cash options (Feb 2026)

### Payment Flow (Current - Feb 2026)
1. User enters amounts and clicks Submit
2. API call records transaction
3. Success screen appears, user clicks OK
4. **"Pay with" chooser** appears with two options:
   - **UPI**: Opens native Android UPI app chooser, waits for return via AppState, then redirects to dashboard
   - **Cash**: Redirects directly to dashboard

## Pending User Verification
- UPI payment flow (requires APK build + real device)
- Firebase Auth fix (requires Play Store build)
- Merchant login crash fix (requires APK build)

## Backlog
- P1: iOS deployment (Apple Developer account, certs, EAS Build)
- P2: Refactor dashboards into reusable DashboardLayout
- P2: Consolidate TypeScript interfaces into central types directory

## Key Files
- `/app/frontend/components/PaymentModal.tsx` - Payment flow with UPI/Cash chooser
- `/app/frontend/app/merchant-dashboard.tsx` - Merchant dashboard
- `/app/frontend/app/dual-dashboard.tsx` - Dual dashboard
- `/app/frontend/app/member-dashboard.tsx` - Member dashboard
- `/app/frontend/google-services.json` - Android Firebase config
- `/app/frontend/GoogleService-Info.plist` - iOS Firebase config
