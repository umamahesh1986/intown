# Firebase SMS OTP Setup Guide

This guide will help you set up Firebase SMS OTP service for the registration flow.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Phone** provider
3. Enable it and save

## Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll down to **Your apps** section
3. Click the **Web app** icon (`</>`) or click "Add app" > Web
4. Register your app (you can use any name)
5. Copy the configuration object

## Step 4: Configure the App

1. Open `intown/frontend/utils/firebase.ts`
2. Replace the placeholder values with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

## Step 5: Test Mode (No Paid Service Required)

For testing without a paid SMS service:

1. Go to **Authentication** > **Sign-in method** > **Phone**
2. Scroll down to **Phone numbers for testing**
3. Click **Add phone number**
4. Add test numbers:
   - Phone: `+91 9999999999` (or any number)
   - Code: `123456` (or any 6-digit code)
5. Save

**Note:** The app will automatically fall back to test mode if Firebase is not configured. Use OTP `123456` for testing.

## Step 6: Production Setup (Paid Service)

For production with real SMS:

1. You need to enable billing in Firebase
2. Go to **Authentication** > **Sign-in method** > **Phone**
3. Configure your SMS provider (Firebase uses multiple providers)
4. Set up app verification (reCAPTCHA will be handled automatically)

## How It Works

1. User enters phone number and clicks "Send OTP"
2. Firebase sends OTP via SMS (or uses test mode)
3. User enters the 6-digit OTP
4. OTP is verified
5. User is redirected to `/user-dashboard`

## Current Implementation

- **Test Mode**: If Firebase is not configured, the app uses test mode with OTP `123456`
- **Real Firebase**: Once configured, it will send real OTPs via SMS
- **Auto-verification**: OTP is automatically verified when all 6 digits are entered

## Troubleshooting

- **"Firebase Not Configured"**: Make sure you've updated `firebase.ts` with your credentials
- **"Invalid API key"**: Check that your API key is correct and not restricted
- **OTP not received**: 
  - Check if you're using test mode (use OTP: 123456)
  - Verify phone number format (+91XXXXXXXXXX)
  - Check Firebase Console for any errors

## Security Notes

- Never commit your Firebase config with real credentials to public repositories
- Use environment variables for production
- Enable App Check for additional security in production

