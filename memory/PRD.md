# InTown Local - Product Requirements Document

## Original Problem Statement
Expo React Native app for local savings/shopping. User wants to pull latest code from GitHub repo `https://github.com/umamahesh1986/intown`, run the application, and see a preview.

## Architecture
- **Framework**: Expo (React Native) with expo-router (file-based routing)
- **State Management**: Zustand
- **Deployment**: Static web export (`npx expo export --platform web`) served via Node.js static server on port 3000
- **External API**: `https://api.intownlocal.com` (CORS blocked in web preview, works on native)
- **No local database** - all data from external API

## What's Been Implemented
- [2025-03-11] Pulled latest from main branch, built and deployed static web app
- Multiple dashboards: user, member, merchant, dual
- Bottom navigation with role-based routing
- Savings and Plans pages
- Feature categories with labels below images
- Location picker modal
- OTP login flow

## Known Issues
- P1: Blank white screen on local dev (localhost:8081)
- P2: CORS blocks API calls in web preview (expected limitation)

## Backlog
- P2: Backend proxy for CORS bypass
- P3: Deduplicate shared styles across dashboards
