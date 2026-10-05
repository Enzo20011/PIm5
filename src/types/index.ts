export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: number; // Unix timestamp for easy serialization
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  rating?: number;
  reviewsCount?: number;
  createdAt: number;
}

export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Textos para mostrar en pantalla. Incluye los estados viejos (shipped/delivered)
// por si quedaron órdenes guardadas con esos valores antes de unificar.
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completada',
  cancelled: 'Cancelada',
  shipped: 'Enviada',
  delivered: 'Completada',
};

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
}
