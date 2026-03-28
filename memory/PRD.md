# InTown - Product Requirements Document

## Original Problem Statement
Build, run, and fix critical issues in the Expo (React Native) mobile app "InTown" for Android, with preparation for iOS release. Integrate Razorpay Subscription & Payment flow.

## Architecture
- **Framework**: Expo (React Native)
- **Project Root**: `/app/frontend`
- **Routing**: expo-router (file-based)
- **State Management**: Zustand
- **Auth**: Firebase Phone Auth
- **External API**: `https://api.intownlocal.com`
- **Payments**: Razorpay (`react-native-razorpay` v2.3.1)

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
- [x] OTP crash fix v2: Comprehensive fix for new user crash (Feb 2026)
- [x] Hide bottom menu on user-dashboard
- [x] Mirror Merchant layout to Customer tab
- [x] **Razorpay Subscription Integration (Feb 2026)**

### Razorpay Subscription Integration Details (Feb 2026)
**Flow**: `/plans` -> select plan -> `/checkout` -> Create Order API -> Razorpay Native Checkout -> Verify Payment -> Dashboard redirect

**Files**:
- `/app/frontend/app/checkout.tsx` - Full checkout page with plan selection, order creation, Razorpay SDK, payment verification
- `/app/frontend/app/plans.tsx` - Plan listing with routing to checkout
- `/app/frontend/app/_layout.tsx` - Registered `checkout` screen in Stack

**API Endpoints Used**:
- `POST https://api.intownlocal.com/IN/payment/create-order` - Creates Razorpay order
- `POST https://api.intownlocal.com/IN/payment/verify` - Verifies payment signature

**Key Implementation Details**:
- `customer_id` loaded from AsyncStorage (set during OTP login)
- Plans: Silver (399/3mo), Gold (599/6mo), Platinum (999/1yr)
- Web fallback: shows informational alert (native module only)
- Dynamic `require('react-native-razorpay')` with try/catch for web safety
- Success redirects to `/member-dashboard`
- Handles cancellation and failure with retry alerts

### Payment Flow (Current)
1. User enters amounts and clicks Submit
2. API call records transaction
3. Success screen appears, user clicks OK
4. "Pay with" chooser appears with two options:
   - **UPI**: Opens native UPI app chooser via `upi://pay`
   - **Cash**: Redirects directly to dashboard

## Pending User Verification
- Razorpay checkout flow (requires APK rebuild with `npx expo prebuild --clean` + real device)
- OTP crash fix for new users (requires APK build + real device)
- UPI payment flow (requires APK build + real device)
- Firebase Auth fix (requires Play Store build with SHA keys)
- Merchant login crash fix (requires APK build)

## Backlog
- P1: Add Razorpay Production Keys (currently using test keys)
- P1: iOS deployment (Apple Developer account, certs, EAS Build)
- P2: Refactor `user-dashboard.tsx` (>2500 lines) into reusable sub-components
- P2: Consolidate TypeScript interfaces into central `types` directory

## Key Files
- `/app/frontend/app/checkout.tsx` - Razorpay checkout page
- `/app/frontend/app/plans.tsx` - Subscription plans page
- `/app/frontend/app/otp.tsx` - OTP verification with crash prevention
- `/app/frontend/components/PaymentModal.tsx` - Payment flow with UPI/Cash chooser
- `/app/frontend/components/ErrorBoundary.tsx` - Error boundary for crash recovery
- `/app/frontend/app/user-dashboard.tsx` - User dashboard
- `/app/frontend/app/member-dashboard.tsx` - Member dashboard
- `/app/frontend/app/merchant-dashboard.tsx` - Merchant dashboard
- `/app/frontend/app/dual-dashboard.tsx` - Dual dashboard
- `/app/frontend/app/_layout.tsx` - Root layout with navigation
- `/app/frontend/store/authStore.ts` - Zustand auth store
- `/app/frontend/utils/api.ts` - API utilities
