import { collection, doc, getDocs, updateDoc, query, where, orderBy, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import type { Order, OrderItem, OrderStatus } from '../types';

export interface CartLine {
  id: string;
  quantity: number;
}

export const orderService = {
  getUserOrders: async (userId: string): Promise<Order[]> => {
    const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },

  // Crea la orden y descuenta el stock en una sola transacción: o pasa todo o no pasa nada.
  // El precio y el stock se leen de Firestore dentro de la transacción (no del carrito),
  // así no se compra con datos viejos ni con un precio manipulado desde el navegador.
  placeOrder: async (userId: string, lines: CartLine[]): Promise<string> => {
    if (lines.length === 0) throw new Error('El carrito está vacío');
    if (lines.some(l => !l.id)) throw new Error('Hay un producto inválido en el carrito. Quitalo y volvé a agregarlo.');

    return runTransaction(db, async (tx) => {
      const products = [];
      for (const line of lines) {
        const ref = doc(db, 'products', line.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('Uno de los productos ya no existe');
        products.push({ ref, line, data: snap.data() });
      }

      const items: OrderItem[] = [];
      let total = 0;
      for (const { line, data } of products) {
        if (line.quantity > data.stock) {
          throw new Error(`No hay stock suficiente de "${data.name}" (quedan ${data.stock})`);
        }
        items.push({
          id: line.id,
          name: data.name,
          price: data.price,
          quantity: line.quantity,
          imageUrl: data.imageUrl,
        });
        total += data.price * line.quantity;
      }

      for (const { ref, line, data } of products) {
        tx.update(ref, { stock: data.stock - line.quantity });
      }

      const orderRef = doc(collection(db, 'orders'));
      tx.set(orderRef, {
        id: orderRef.id,
        userId,
        items,
        total,
        status: 'pending' as OrderStatus,
        createdAt: Date.now(),
      });
      return orderRef.id;
    });
  },

  getAdminOrders: async (): Promise<Order[]> => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
  }
};
