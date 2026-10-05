import { createContext, useReducer, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../types';
import toast from 'react-hot-toast';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  total: 0
};

// Tope por stock; si un producto viejo no tiene el campo, no limitamos
const maxQuantity = (item: CartItem) => (typeof item.stock === 'number' ? item.stock : Infinity);

const calculateTotal = (items: CartItem[]) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      let newItems;
      if (existingItem) {
        // No dejamos pasar del stock disponible
        if (existingItem.quantity >= maxQuantity(existingItem)) return state;
        newItems = state.items.map(item =>
          item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        if (action.payload.stock < 1) return state;
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }
      return { items: newItems, total: calculateTotal(newItems) };
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return { items: newItems, total: calculateTotal(newItems) };
    }
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      // Cantidad 0 o negativa = sacar el producto; si pasa el stock, se topa en el stock
      const newItems = state.items
        .map(item => (item.id === id ? { ...item, quantity: Math.min(quantity, maxQuantity(item)) } : item))
        .filter(item => item.quantity > 0);
      return { items: newItems, total: calculateTotal(newItems) };
    }
    case 'CLEAR_CART':
      return initialState;
    default:
      return state;
  }
};

interface CartContextType extends CartState {
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartContext.Provider value={{
      ...state,
      addItem: (product) => {
        const existing = state.items.find(item => item.id === product.id);
        if (product.stock < 1 || (existing && existing.quantity >= maxQuantity(existing))) {
          toast.error(`No hay más stock de "${product.name}"`);
          return;
        }
        if (existing) {
          toast.success(`Añadiste otro "${product.name}" al carrito`, { icon: '🛒' });
        } else {
          toast.success(`"${product.name}" añadido al carrito`, { icon: '🛒' });
        }
        dispatch({ type: 'ADD_ITEM', payload: product });
      },
      removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
      updateQuantity: (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' })
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
