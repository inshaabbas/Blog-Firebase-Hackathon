// import { initializeApp } from "firebase/app";

// const firebaseConfig = {
//   apiKey: "AIzaSyCUs9cpOPxU3jhBB7NcvZ8odrrTrIS2Xgk",
//   authDomain: "fir-mini-hackathon.firebaseapp.com",
//   projectId: "fir-mini-hackathon",
//   storageBucket: "fir-mini-hackathon.firebasestorage.app",
//   messagingSenderId: "338726191329",
//   appId: "1:338726191329:web:63edb0b71a706dbbbcb7a0"
// };


// const app = initializeApp(firebaseConfig);import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";


// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// REPLACE THIS WITH YOUR FIREBASE CONFIG FROM STEP 1.5

const firebaseConfig = {
  apiKey: "AIzaSyCUs9cpOPxU3jhBB7NcvZ8odrrTrIS2Xgk",
  authDomain: "fir-mini-hackathon.firebaseapp.com",
  projectId: "fir-mini-hackathon",
  storageBucket: "fir-mini-hackathon.firebasestorage.app",
  messagingSenderId: "338726191329",
  appId: "1:338726191329:web:63edb0b71a706dbbbcb7a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);