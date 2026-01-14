import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
  apiKey: "AIzaSyCUs9cpOPxU3jhBB7NcvZ8odrrTrIS2Xgk",
  authDomain: "fir-mini-hackathon.firebaseapp.com",
  projectId: "fir-mini-hackathon",
  storageBucket: "fir-mini-hackathon.appspot.com",
  messagingSenderId: "338726191329",
  appId: "1:338726191329:web:63edb0b71a706dbbbcb7a0"
};

// ==================== INITIALIZE FIREBASE ====================
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
