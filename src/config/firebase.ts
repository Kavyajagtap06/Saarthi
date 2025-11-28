import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBVg9NipcV4Y3-X4TJ-9aI_SLeEe_7XsyU",
  authDomain: "saarthi-safewalk.firebaseapp.com",
  projectId: "saarthi-safewalk",
  storageBucket: "saarthi-safewalk.firebasestorage.app",
  messagingSenderId: "120361341966",
  appId: "1:120361341966:android:4cd74dfa9e6ac78b11585f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth (without persistence for now)
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;