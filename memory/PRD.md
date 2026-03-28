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
- [x] **URL Consolidation Refactor** — All 20+ hardcoded `api.intownlocal.com` URLs across 12 files consolidated to single `INTOWN_API_BASE` constant exported from `utils/api.ts`

### Razorpay Subscription Flow
`/plans` → select plan → `/checkout` → Create Order API → Razorpay Native Checkout → Verify Payment → Dashboard redirect

### URL Consolidation (Feb 2026)
- Single source of truth: `BASE_URL` in `utils/api.ts` line 4
- Derived constant: `INTOWN_API_BASE = ${BASE_URL}/IN` (exported)
- 12 files updated to import `INTOWN_API_BASE` instead of hardcoding URLs
- Files updated: checkout, member-card, savings, merchant-dashboard, register-member, account, member-shop-details, member-shop-list, member-dashboard, register-merchant, dual-dashboard, PaymentModal

## Pending User Verification
- Razorpay checkout (requires APK rebuild + real device)
- OTP crash fix for new users
- Firebase Auth fix (SHA keys from Play Console)

## Backlog
- P1: Add Razorpay Production Keys
- P1: iOS deployment (Apple Developer account)
- P2: Refactor `user-dashboard.tsx` (>2500 lines) into sub-components
- P2: Consolidate TypeScript interfaces into central `types` directory

## Key Files
- `/app/frontend/utils/api.ts` — Single source for all API URLs + exports `INTOWN_API_BASE`
- `/app/frontend/app/checkout.tsx` — Razorpay checkout page
- `/app/frontend/app/plans.tsx` — Subscription plans page
- `/app/frontend/app/_layout.tsx` — Root layout with navigation
- `/app/frontend/app/otp.tsx` — OTP verification
- `/app/frontend/store/authStore.ts` — Zustand auth store
- `/app/frontend/components/PaymentModal.tsx` — Payment flow
