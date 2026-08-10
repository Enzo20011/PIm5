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

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: any[];
  total: number;
  status: OrderStatus;
  createdAt: number;
}
