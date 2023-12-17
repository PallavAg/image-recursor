// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCjk3_pK9vSWocmSYR4Hr26k756YhIpCD0",
  authDomain: "image-recursor.firebaseapp.com",
  projectId: "image-recursor",
  storageBucket: "image-recursor.appspot.com",
  messagingSenderId: "659189185128",
  appId: "1:659189185128:web:e5a4da433290772804d9dd",
  measurementId: "G-RSNB5X2GML",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
