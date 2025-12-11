import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // NEW: Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyC-Z3WzW9r2Dsuz5k3QzUckSOkAzEfbKic",
  authDomain: "xgpt-b412b.firebaseapp.com",
  projectId: "xgpt-b412b",
  storageBucket: "xgpt-b412b.firebasestorage.app",
  messagingSenderId: "174512203722",
  appId: "1:174512203722:web:01816922ed80cd6cdc9133",
  measurementId: "G-DGT2XKGWJJ"
};

const app = initializeApp(firebaseConfig);

// Export Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut };

// NEW: Export Database
export const db = getFirestore(app);