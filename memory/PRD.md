# IntownLocal - Product Requirements Document

## Original Problem Statement
Take update from "https://github.com/umamahesh1986/intown" then run the application and show preview (main branch). It is a React Expo app.

## Architecture
- **Frontend**: React Native with Expo (file-based routing via expo-router)
- **Backend**: FastAPI with MongoDB
- **Web Build**: Static export using expo export --platform web

## What's Been Implemented (March 10, 2026)
1. ✅ Cloned repository from GitHub (main branch)
2. ✅ Installed frontend dependencies
3. ✅ Built static web version using `expo export --platform web`
4. ✅ Configured static file server for web preview
5. ✅ App running at preview URL

## App Features (from codebase)
- OTP-based mobile authentication (use 1234 for testing)
- User Dashboard with category grid
- Map integration with Google Maps
- Shop discovery with distance calculation
- Payment flow with multiple methods (UPI, Card, Net Banking, Wallet)
- Member/Merchant dual dashboard system

## Technical Notes
- Container limitation: File watcher limit prevents Expo dev server from running
- Workaround: Using static export + Node.js server

## Core Requirements
- Mobile-first React Native app using Expo
- File-based routing with expo-router
- Firebase authentication integration
- Google Maps for location services
- MongoDB backend

## Backlog / Future Tasks
- P0: Test complete authentication flow
- P1: Verify all API endpoints working
- P2: Add hot reload capability for development
- P3: Mobile app testing with Expo Go
