# InTown Local - Product Requirements Document

## Original Problem Statement
Expo React Native app for local savings/shopping. User wants to pull latest code from GitHub repo `https://github.com/umamahesh1986/intown`, run the application, and see a preview.

## Architecture
- **Framework**: Expo (React Native) with expo-router (file-based routing)
- **State Management**: Zustand
- **Deployment**: Static web export (`npx expo export --platform web`) served via Node.js static server on port 3000
- **External API**: `https://api.intownlocal.com` (CORS blocked in web preview, works on native)
- **Authentication**: Firebase Phone Auth (real OTP via SMS)
- **No local database** - all data from external API

## What's Been Implemented
- [2025-03-12] Removed test OTP (123456) and implemented real Firebase Phone Auth with reCAPTCHA for web and native Firebase auth for mobile
- [2025-03-12] Fixed blank white screen on local dev - added runtime CSS injection in `_layout.tsx` for web
- [2025-03-11] Fixed Plans page: `isPopular` set to false for regular user flow
- [2025-03-11] Pulled latest from main branch, built and deployed static web app
- Multiple dashboards: user, member, merchant, dual
- Bottom navigation with role-based routing
- Savings and Plans pages
- Feature categories with labels below images
- Location picker modal

## Key Files Modified
- `app/otp.tsx` - Real Firebase OTP (removed all test mode code)
- `app/_layout.tsx` - Added web CSS injection for full-height layout
- `app/plans.tsx` - isPopular override for user flow
- `firebase/firebaseConfig.ts` - Firebase config with web/mobile auth setup

## Known Issues
- P2: CORS blocks API calls in web preview (expected limitation, works on native)

## Backlog
- P2: Backend proxy for CORS bypass
- P3: Deduplicate shared styles across dashboards
