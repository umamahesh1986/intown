import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
   FIREBASE AUTH
================================ */
const auth = getAuth(app);

export { auth };
