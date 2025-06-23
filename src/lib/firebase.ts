// IMPORTANT: Replace the following with your app's Firebase project configuration
// You can get this from the Firebase console.
// It's recommended to use environment variables to store your Firebase config.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmG2EpkoeSS1AqwAn81TxQF0zv8J0DmKQ",
  authDomain: "echo-chamber-a4175.firebaseapp.com",
  projectId: "echo-chamber-a4175",
  storageBucket: "echo-chamber-a4175.appspot.com",
  messagingSenderId: "956388484196",
  appId: "1:956388484196:web:8655c65f2479e0a08e1a66",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
