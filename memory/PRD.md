# InTown Local App - PRD

## Original Problem Statement
Build a React Native (Expo) application for InTown Local that enables:
1. Firebase Phone OTP Authentication
2. API Integration with `https://devapi.intownlocal.com/IN/search/{phoneNumber}`
3. Role-Based Redirection based on userType (`new_user`, `in_Customer`, `in_Merchant`)
4. Dashboard screens for User, Customer, Merchant, and Dual roles

## Core Requirements
- Phone number authentication via Firebase
- OTP verification with auto-fill support on mobile
- User type detection from external API
- Role-based dashboard navigation
- User type labels in dashboard headers

## Tech Stack
- **Frontend**: React Native, Expo, TypeScript
- **Navigation**: Expo Router
- **Authentication**: Firebase Phone Auth
- **API**: Axios
- **State**: Zustand
- **Storage**: AsyncStorage

## Architecture
```
/app/frontend/
├── app/                    # Screens (Expo Router)
│   ├── login.tsx          # Phone input + video background
│   ├── otp.tsx            # OTP verification
│   ├── user-dashboard.tsx # New user dashboard
│   ├── member-dashboard.tsx # Customer dashboard
│   ├── merchant-dashboard.tsx # Merchant dashboard
│   └── dual-dashboard.tsx # Dual role dashboard
├── firebase/
│   └── firebaseConfig.ts  # Firebase initialization
├── utils/
│   └── api.ts             # API functions
└── store/
    └── authStore.ts       # Auth state management
```

## What's Been Implemented

### Completed Features (Jan 20, 2026)
- [x] Firebase Phone Authentication setup
- [x] Web Test Mode with static OTP (123456) for development
- [x] Mobile real OTP flow with reCAPTCHA
- [x] API integration for user search
- [x] Role determination logic
- [x] Dashboard screens (User, Member, Merchant, Dual)
- [x] **User Type Label in Headers** - All dashboards now display user role badges
- [x] Enhanced API error logging for mobile debugging
- [x] Mobile background video on login screen (expo-av)

### Pending Issues
1. **AxiosError: Network Error on Mobile (P0)** - Enhanced logging added; likely device network configuration issue
2. **OTP Auto-fill verification (P2)** - Implemented but needs mobile testing
3. **Git history corruption (P3/BLOCKED)** - Cannot fix; recommend fresh clone

## API Endpoints
- `GET https://devapi.intownlocal.com/IN/search/{phone}` - User lookup
- `POST https://devapi.intownlocal.com/IN/customer/` - Customer registration
- `POST https://devapi.intownlocal.com/IN/merchant/` - Merchant registration
- `GET https://devapi.intownlocal.com/IN/categories` - Categories list

## Testing Notes
- **Web OTP**: Use `123456` as test OTP
- **Mobile**: Real SMS OTP via Firebase

## Key Files
- `/app/frontend/utils/api.ts` - API calls with enhanced error logging
- `/app/frontend/app/otp.tsx` - OTP verification logic
- `/app/frontend/firebase/firebaseConfig.ts` - Firebase config
- `/app/frontend/app/*-dashboard.tsx` - Dashboard screens with user type badges

## Next Steps
1. Test mobile app with real device to debug AxiosError
2. Verify OTP auto-fill on iOS/Android
3. Test background video on mobile devices
