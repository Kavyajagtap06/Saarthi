// src/config/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Use simple getAuth
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';


const firebaseConfig = {
  apiKey: "AIzaSyBVg9NipcV4Y3-X4TJ-9aI_SLeEe_7XsyU",
  authDomain: "saarthi-safewalk.firebaseapp.com",
  databaseURL: "https://saarthi-safewalk-default-rtdb.firebaseio.com",
  projectId: "saarthi-safewalk",
  storageBucket: "saarthi-safewalk.firebasestorage.app",
  messagingSenderId: "120361341966",
  appId: "1:120361341966:android:4cd74dfa9e6ac78b11585f"
};

// Initialize Firebase only if it doesn't exist
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use simple getAuth without persistence
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
export default app;