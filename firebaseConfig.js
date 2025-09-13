import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
import { getAuth } from "firebase/auth";
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBTtqzCj4dDByrXP6o-cNDYlk83oYoLhR8",
  authDomain: "clearskin-ai-7d0d0.firebaseapp.com",
  projectId: "clearskin-ai-7d0d0",
  storageBucket: "clearskin-ai-7d0d0.firebasestorage.app",
  messagingSenderId: "995491705290",
  appId: "1:995491705290:web:5d5de9eac1c2a7908e9f33",
  measurementId: "G-KX3H2Z0H6V"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase

export { auth }
export default app
