import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/* ===============================
   FIREBASE CONFIG
================================ */
export const firebaseConfig = {
  apiKey: "AIzaSyBCaGJ3dq0Hrbsj32hy8c3R-jred8R9caU",
  authDomain: "intown-dev-d4661.firebaseapp.com",
  projectId: "intown-dev-d4661",
  storageBucket: "intown-dev-d4661.appspot.com",
  messagingSenderId: "365677663172",
  appId: "1:365677663172:android:9e992e48e5f12d5f130a91",
};

/* ===============================
   INITIALIZE FIREBASE APP
================================ */
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

/* ===============================
   FIREBASE AUTH WITH PERSISTENCE
================================ */
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // For React Native, use AsyncStorage for persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error: any) {
    // If already initialized, just get the existing auth instance
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      console.warn('Firebase auth initialization error:', error);
      auth = getAuth(app);
    }
  }
}

export { auth };
