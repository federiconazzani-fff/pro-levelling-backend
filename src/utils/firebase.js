import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// --- CONFIGURAZIONE FIREBASE ---
// Sostituisci i placeholder qui sotto con le chiavi del tuo progetto Firebase Console
// Impostazioni Progetto -> In basso: App Web
const firebaseConfig = {
  apiKey: "AIzaSyC2CSOe1JpOwBnRukLn7qw4g84AWpgnhqk",
  authDomain: "prolevelling-9bfba.firebaseapp.com",
  projectId: "prolevelling-9bfba",
  storageBucket: "prolevelling-9bfba.firebasestorage.app",
  messagingSenderId: "986409597877",
  appId: "1:986409597877:web:dcf69e42d8bae38269f7fc",
  measurementId: "G-DE7R2FMHPS"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza i servizi
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
