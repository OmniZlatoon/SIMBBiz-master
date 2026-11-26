// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFhds2O9459aHQn1QDrLO9ODvA01zbdAE",
  authDomain: "simbizz.firebaseapp.com",
  projectId: "simbizz",
  storageBucket: "simbizz.firebasestorage.app",
  messagingSenderId: "580908093905",
  appId: "1:580908093905:web:7659662d4c7164ad0690f0",
  measurementId: "G-597YJJFDWW"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
