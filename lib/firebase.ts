import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY || "AIzaSyAdDe4k2_GM6pB1IO8D4cGPstFO13b-sqo",
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN || "kahoot-5fa99.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID || "kahoot-5fa99",
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET || "kahoot-5fa99.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FB_SENDER_ID || "350134490481",
  appId: process.env.NEXT_PUBLIC_FB_APP_ID || "1:350134490481:web:914e0c2791504088d112d0",
  measurementId: process.env.NEXT_PUBLIC_FB_MEASUREMENT_ID || "G-0TSJ3HDDL3"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});