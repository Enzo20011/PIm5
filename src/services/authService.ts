import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types';

export const authService = {
  getOrCreateUserProfile: async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    } else {
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: 'customer',
        createdAt: Date.now(),
      };
      
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  }
};
