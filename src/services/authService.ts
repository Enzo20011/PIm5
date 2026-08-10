import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import type { UserProfile, UserRole } from '../types';

export const authService = {
  // Función auxiliar para obtener o crear el perfil de usuario en Firestore
  async getOrCreateUserProfile(user: FirebaseUser, role: UserRole = 'customer'): Promise<UserProfile> {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }

    // Si el usuario no existe en Firestore (ej: primer login con Google), lo creamos
    const newUserProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role,
      createdAt: Date.now()
    };

    await setDoc(userDocRef, newUserProfile);
    return newUserProfile;
  }
};
