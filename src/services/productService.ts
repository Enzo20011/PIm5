import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, limit as fsLimit, startAfter, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Product } from '../types';

export const productService = {
  getProductById: async (id: string): Promise<Product | null> => {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Product) : null;
  },
  getProducts: async (limitCount: number, lastDoc?: any, category?: string): Promise<{ products: Product[], lastDoc: any }> => {
    const constraints = category && category !== 'All' ? [where('category', '==', category)] : [];
    let q = query(collection(db, 'products'), ...constraints, orderBy('createdAt', 'desc'), fsLimit(limitCount));
    if (lastDoc) {
      q = query(collection(db, 'products'), ...constraints, orderBy('createdAt', 'desc'), startAfter(lastDoc), fsLimit(limitCount));
    }
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    return { products, lastDoc: newLastDoc };
  },
  getAllCategories: async (): Promise<string[]> => {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const cats = querySnapshot.docs.map(doc => (doc.data() as Product).category);
    return Array.from(new Set(cats));
  },
  updateProduct: async (id: string, data: Partial<Product>): Promise<void> => {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, data);
  },
  deleteProduct: async (id: string): Promise<void> => {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  },
  createProduct: async (data: Partial<Product>): Promise<void> => {
    const newRef = doc(collection(db, 'products'));
    await setDoc(newRef, { ...data, id: newRef.id, createdAt: Date.now() });
  }
};
