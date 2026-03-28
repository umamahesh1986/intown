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
