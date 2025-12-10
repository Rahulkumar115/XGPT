import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module"; 

// 1. Create a "require" function to load the JSON key
const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

// 2. Initialize Firebase
initializeApp({
  credential: cert(serviceAccount)
});

// 3. Export the Database
const db = getFirestore();
export { db };