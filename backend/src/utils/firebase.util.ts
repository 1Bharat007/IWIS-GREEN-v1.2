import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const initFirebaseAdmin = () => {
  if (getApps().length > 0) return;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountJson) {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT is not set. Firebase Auth will fail.");
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    initializeApp({
      credential: cert(serviceAccount)
    });
    
    console.log("🔥 Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error);
  }
};

export const getFirebaseAuth = () => {
  if (getApps().length === 0) {
    initFirebaseAdmin();
  }
  return getAuth();
};
