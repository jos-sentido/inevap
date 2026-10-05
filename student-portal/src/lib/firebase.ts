import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config pública del proyecto Firebase `inevap-portal`.
// Son identificadores públicos (no secretos); la seguridad la dan Auth + Security Rules.
// Se pueden sobreescribir con variables VITE_FIREBASE_* en Vercel.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAH2FWhl9DMa7b2PJQZvyXtMq3hJtW810g',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'inevap-portal.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'inevap-portal',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'inevap-portal.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '772666718438',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:772666718438:web:fcbf76e499ba4883d82327',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
