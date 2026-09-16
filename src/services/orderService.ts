import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Order } from '../types';

export const orderService = {
  getUserOrders: async (userId: string): Promise<Order[]> => {
    const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },
  createOrder: async (data: Partial<Order>): Promise<void> => {
    const newRef = doc(collection(db, 'orders'));
    await setDoc(newRef, { ...data, id: newRef.id, createdAt: Date.now() });
  },
  getAdminOrders: async (): Promise<Order[]> => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },
  updateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
  }
};
