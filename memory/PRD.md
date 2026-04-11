# IntownLocal - PRD & Progress

## Original Problem Statement
Clone the InTown Local React Native Expo app from GitHub (https://github.com/umamahesh1986/intown.git, branch: main) and run the mobile app preview.

## Architecture
- **Frontend**: React Native + Expo SDK 54 with expo-router
- **Backend**: External APIs at `https://api.intownlocal.com` (pre-existing, no local backend needed)
- **State Management**: Zustand
- **Navigation**: expo-router (file-based routing)
- **Web Rendering**: react-native-web

## User Personas
- **Members (Customers)**: Local shoppers looking for nearby shops and savings
- **Merchants**: Local shop owners registering their businesses

## Core Features (Implemented in Cloned App)
- OTP-based phone login (mock OTP: 1234)
- User Dashboard with location, search, categories, savings calculator
- Member registration & dashboard
- Merchant registration & dashboard
- Dual dashboard (both roles)
- Shop discovery with categories (Groceries, Beauty, Laundry, etc.)
- Savings calculator
- Payment flow (mocked)
- Shop details & navigation

## What's Been Done (Jan 2026)
- Cloned repo from GitHub (main branch)
- Set up Expo web build (static export via `expo export --platform web`)
- Created static file server (`serve-web.js`) on port 3000
- App running successfully with all screens accessible
- Live API connection to `https://api.intownlocal.com` working
- Login flow → OTP verification → Dashboard flow verified

## Tech Stack
- Expo SDK 54, React Native 0.81.5, React 19.1.0
- expo-router 6.x, zustand 5.x
- Firebase (auth + app-check), react-native-maps
- axios for API calls

## Screens Available
/, /login, /otp, /user-dashboard, /member-dashboard, /merchant-dashboard, /dual-dashboard, /register-member, /register-merchant, /search, /shop-details, /member-shop-list, /member-shop-details, /plans, /payment, /checkout, /savings, /account, /addresses, /map, /location, /location-picker, /profile-menu, /member-card, /member-navigate, /payment-history

## Backlog / Next Steps
- P0: None (app is running)
- P1: UI/UX improvements for web layout (currently mobile-optimized)
- P2: Real SMS/OTP integration, real payment gateway
- P3: Push notifications, analytics, App Store/Play Store deployment
