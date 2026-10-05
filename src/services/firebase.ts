import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// En producción, si falta una variable cortamos con un mensaje claro en vez de
// arrancar con claves falsas y fallar de forma rara más adelante.
// En desarrollo/tests se usan valores de relleno para poder levantar la app sin Firebase.
if (env.PROD) {
  const missing = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno de Firebase (VITE_FIREBASE_*): ${missing.join(', ')}. Cargalas en Vercel → Settings → Environment Variables y volvé a desplegar.`
    );
  }
}

const app = initializeApp({
  apiKey: firebaseConfig.apiKey || 'dummy-api-key',
  authDomain: firebaseConfig.authDomain || 'dummy-app.firebaseapp.com',
  projectId: firebaseConfig.projectId || 'dummy-app',
  storageBucket: firebaseConfig.storageBucket || 'dummy-app.appspot.com',
  messagingSenderId: firebaseConfig.messagingSenderId || '1234567890',
  appId: firebaseConfig.appId || '1:1234567890:web:dummy',
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
