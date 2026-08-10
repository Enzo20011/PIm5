import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Order } from '../types';

const COLLECTION_NAME = 'orders';
const ordersRef = collection(db, COLLECTION_NAME);

export const orderService = {
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: Date.now()
    });
    return docRef.id;
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const q = query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    return orders;
  },

  async getAdminOrders(): Promise<Order[]> {
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    return orders;
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orderDoc = doc(db, COLLECTION_NAME, orderId);
    await updateDoc(orderDoc, { status });
  }
};
