// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1VaL9RCaSQSthAwaJpWQzankXE5CfEeE",
  authDomain: "onemealonesmile-9b2d5.firebaseapp.com",
  projectId: "onemealonesmile-9b2d5",
  storageBucket: "onemealonesmile-9b2d5.firebasestorage.app",
  messagingSenderId: "950702446871",
  appId: "1:950702446871:web:6834b6ae80bbd717dfff52",
  measurementId: "G-7H7RZCKKST",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Authentication
const googleProvider = new GoogleAuthProvider(); // Google Provider
const db = getFirestore(app); // Initialize Firestore Database

// Export for use in other files
export { auth, googleProvider, db };
