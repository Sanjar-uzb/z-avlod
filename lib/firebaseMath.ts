import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeFirestore, type Firestore } from "firebase/firestore";

/**
 * Matematika o'yini uchun ALOHIDA Firebase loyihasi (kahootdan mustaqil).
 * Bu faqat "Web app config" (public) — maxfiy service account kaliti emas.
 * Qiymatlar Firebase Console -> Project settings -> Your apps -> Web app config'dan olinadi.
 */
const mathFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_MATH_FB_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_MATH_FB_AUTH_DOMAIN || "matematik-26d6f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_MATH_FB_PROJECT_ID || "matematik-26d6f",
  storageBucket: process.env.NEXT_PUBLIC_MATH_FB_STORAGE_BUCKET || "matematik-26d6f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_MATH_FB_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_MATH_FB_APP_ID || "",
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
