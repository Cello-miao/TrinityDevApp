export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: 'customer' | 'admin';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  barcode?: string;
  stock: number;
  discount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  createdAt: string;
  deliveryAddress: string;
  paymentMethod: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
}
