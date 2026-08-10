import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import type { Product } from '../types';

const COLLECTION_NAME = 'products';
const productsRef = collection(db, COLLECTION_NAME);

export const productService = {
  // Obtener lista paginada de productos
  async getProducts(limitCount = 20, lastVisible?: QueryDocumentSnapshot): Promise<{ products: Product[], lastDoc: QueryDocumentSnapshot | null }> {
    let q = query(productsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    
    if (lastVisible) {
      q = query(productsRef, orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(limitCount));
    }

    const snapshot = await getDocs(q);
    const products: Product[] = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });

    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { products, lastDoc };
  },

  // Obtener un solo producto
  async getProductById(id: string): Promise<Product | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Product;
    }
    return null;
  },

  // Crear producto (Requiere Rol Admin validado por Reglas de Firestore)
  async createProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(productsRef, {
      ...productData,
      createdAt: Date.now()
    });
    return docRef.id;
  },

  // Actualizar producto
  async updateProduct(id: string, productData: Partial<Product>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, productData);
  },

  // Eliminar producto
  async deleteProduct(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
