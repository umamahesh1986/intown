# INtown Local - Product Requirements Document

## Original Problem Statement
Build a React Native (Expo) mobile app with Firebase phone authentication, featuring role-based dashboards for users, members, merchants, and dual roles. Key features include location-based shop discovery, navigation maps, and payment processing.

## User Personas
1. **User/Customer** - Browse nearby shops, view details, register as member
2. **Member** - Full access to shop navigation, payment processing
3. **Merchant** - Business dashboard, manage shop details
4. **Dual** - Both merchant and member capabilities

## Core Requirements
- Firebase Phone OTP Authentication (requires Development Build, not Expo Go)
- Role-based navigation to 4 different dashboards
- Location-based shop discovery with Zomato-style search
- Enhanced navigation maps with route display, distance/ETA
- Payment processing integration
- User profile management (editable name/email)

## Technical Stack
- **Frontend:** React Native, Expo, Expo Router, TypeScript
- **State Management:** Zustand
- **Authentication:** @react-native-firebase/auth
- **Build Process:** EAS Build (development & production profiles)

## What's Been Implemented

### Authentication
- [x] Phone OTP login with Firebase
- [x] Test mode fallback (OTP: 123456) for development
- [x] Migrated from deprecated expo-firebase-recaptcha to @react-native-firebase/auth

### Dashboards
- [x] User dashboard with nearby shops display
- [x] Member dashboard with full shop access
- [x] Merchant dashboard with "My Account" menu
- [x] Dual dashboard for combined roles
- [x] Dynamic name display (customer/merchant names from API)
- [x] KeyboardAvoidingView on location search modals (user, member, merchant)

### Shop Features
- [x] Shop list with empty state message ("We are working on to serve at your location")
- [x] Shop details page with category badges, ratings, info cards
- [x] Navigate button with route display (styled like Google Maps)
- [x] Distance/ETA calculation
- [x] "Start Navigation" deep-link to Google Maps

### Registration
- [x] Member registration form with image upload
- [x] Merchant registration form with image upload
- [x] Remove ('x') icon for selected images

### Profile
- [x] Editable Name and Email fields on My Account page
- [x] Profile update saved to backend

## Recent Bug Fixes (Dec 2025)
- [x] Fixed SyntaxError in member-shop-details.tsx (getCategoryBadge returning wrong type)
- [x] Fixed shop name display showing object instead of name
- [x] Fixed Nearby Shop crash (React Hook violation)
- [x] Fixed image preview not showing in merchant registration
- [x] Fixed 'x' icon clipping on image uploads

## Pending Issues

### P0 - Critical
- None currently blocking

### P1 - High Priority
- Real SMS OTP flow requires user Firebase/GCP configuration (SHA fingerprints, Play Integrity, App Check)
- Test environment uses fallback OTP: 123456

### P2 - Medium Priority  
- AxiosError: Network Error on mobile (blocked by P1)
- Background video not playing on mobile login (blocked by P1)

### P3 - Low Priority
- KeyboardAvoidingView not applied to dual-dashboard.tsx location modal

## Upcoming Tasks
1. Apply KeyboardAvoidingView fix to dual-dashboard.tsx
2. Full e2e testing on physical device once build stable
3. Verify real OTP flow with proper Firebase setup

## Future/Backlog
1. **Refactor Location Feature** - Extract location modal logic into reusable hook/component (duplicated across user, member, merchant dashboards)
2. Code cleanup and deduplication
3. Performance optimization

## Key Files
- `/app/frontend/app/member-shop-details.tsx` - Shop details page
- `/app/frontend/app/otp.tsx` - OTP verification with test mode
- `/app/frontend/app.json` - Firebase plugins config
- `/app/frontend/app/*-dashboard.tsx` - Role-based dashboards

## API Endpoints
- `https://api.intownlocal.com/IN/search/by-product-names`
- `POST https://devapi.intownlocal.com/IN/search/{phoneNumber}`
- Profile update endpoint (used in account.tsx)

## Test Credentials
- **Test OTP:** 123456 (fallback when Play Integrity fails)
