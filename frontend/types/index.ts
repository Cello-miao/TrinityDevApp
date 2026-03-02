export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  phone?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  billing_address?: string;
  billing_zip_code?: string;
  billing_city?: string;
  billing_country?: string;
  address?: string;
  role: 'user' | 'admin' | 'manager';
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
  brand?: string;
  nutritionalInfo?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  cartItemId?: number; // Backend cart item ID for deletion
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'completed';
  createdAt: string;
  deliveryAddress: string;
  paymentMethod: string;
  customerName?: string;
  customerEmail?: string;
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
