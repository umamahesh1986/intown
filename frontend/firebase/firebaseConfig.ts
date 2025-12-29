import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

/* ===============================
   FIREBASE CONFIG
================================ */
const firebaseConfig = {
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
const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

/* ===============================
   FIREBASE AUTH (EXPO-SAFE)
================================ */
export const auth = getAuth(app);
