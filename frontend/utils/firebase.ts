import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, PhoneAuthProvider, signInWithCredential, PhoneAuthCredential } from 'firebase/auth';

/**
 * FIREBASE SETUP INSTRUCTIONS:
 * 
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select an existing one
 * 3. Enable Phone Authentication:
 *    - Go to Authentication > Sign-in method
 *    - Enable "Phone" provider
 *    - For testing, you can add test phone numbers in the Firebase Console
 * 
 * 4. Get your Firebase config:
 *    - Go to Project Settings > General
 *    - Scroll down to "Your apps" section
 *    - Click on the Web app icon (</>) or add a new web app
 *    - Copy the config values below
 * 
 * 5. For TEST MODE (no paid service needed):
 *    - Firebase provides test phone numbers that work without SMS
 *    - Go to Authentication > Sign-in method > Phone > Phone numbers for testing
 *    - Add test numbers like: +91 9999999999 with OTP: 123456
 *    - The app will automatically use test mode if Firebase is not configured
 * 
 * 6. Replace the values below with your Firebase project credentials
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Check if Firebase is properly configured
const isFirebaseConfigured = 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
  firebaseConfig.apiKey &&
  firebaseConfig.projectId;

// Initialize Firebase only if properly configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
    } else {
      app = getApps()[0];
      auth = getAuth(app);
    }
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    app = null;
    auth = null;
  }
} else {
  console.log('Firebase not configured - using test mode');
}

// Export Firebase instances (may be null if not configured)
export { auth, PhoneAuthProvider, signInWithCredential, isFirebaseConfigured };
export type { PhoneAuthCredential };

