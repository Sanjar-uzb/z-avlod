import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeFirestore, type Firestore } from "firebase/firestore";

/**
 * Matematika o'yini uchun ALOHIDA Firebase loyihasi (kahootdan mustaqil).
 * Bu faqat "Web app config" (public) — maxfiy service account kaliti emas.
 * API key public, xavfsizlikni Firestore security rules ta'minlaydi.
 * Kerak bo'lsa NEXT_PUBLIC_MATH_FB_* orqali almashtiriladi.
 */
const mathFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_MATH_FB_API_KEY || "AIzaSyBbpGRSOuf4EwQ1W6Me96xVkvizgql-sbs",
  authDomain: process.env.NEXT_PUBLIC_MATH_FB_AUTH_DOMAIN || "matematik-26d6f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_MATH_FB_PROJECT_ID || "matematik-26d6f",
  storageBucket: process.env.NEXT_PUBLIC_MATH_FB_STORAGE_BUCKET || "matematik-26d6f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_MATH_FB_SENDER_ID || "459877199236",
  appId: process.env.NEXT_PUBLIC_MATH_FB_APP_ID || "1:459877199236:web:1b2de919d6b7ce845441d1",
};

export const MATH_FIREBASE_PROJECT_ID = mathFirebaseConfig.projectId;

export const isMathFirebaseConfigured = Boolean(
  mathFirebaseConfig.apiKey && mathFirebaseConfig.appId,
);

function resolveMathApp(): FirebaseApp | null {
  if (!isMathFirebaseConfigured) return null;
  const existing = getApps().find((app) => app.name === "matematika");
  if (existing) return existing;
  return initializeApp(mathFirebaseConfig, "matematika");
}

export const mathApp = resolveMathApp();

export const dbMath: Firestore | null = mathApp
  ? initializeFirestore(mathApp, { experimentalForceLongPolling: true })
  : null;
