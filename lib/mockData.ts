import { Product, Order, Customer } from '../types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Apples',
    price: 4.50,
    category: 'Fresh Produce',
    stock: 80,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800',
    barcode: '3456789012345',
    description: 'Fresh organic apples, crisp texture, and full of nutrients.'
  },
  {
    id: '2',
    name: 'Ripe Bananas',
    price: 2.29,
    category: 'Fresh Produce',
    stock: 150,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800',
    barcode: '3456789012346',
    description: 'Sweet and creamy bananas, perfect for snacking or smoothies.'
  },
  {
    id: '3',
    name: 'Fresh Tomatoes',
    price: 3.49,
    category: 'Fresh Produce',
    stock: 95,
    image: 'https://images.unsplash.com/photo-1443131612988-32b6d97cc5da?w=800',
    barcode: '3456789012347',
    description: 'Vine-ripened tomatoes, bursting with flavor and vitamins.'
  },
  {
    id: '4',
    name: 'Whole Wheat Bread',
    price: 3.99,
    category: 'Bakery',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    barcode: '1234567890123',
    description: 'Made with 100% organic whole wheat flour, rich in dietary fiber.'
  },
  {
    id: '5',
    name: 'French Baguette',
    price: 2.79,
    category: 'Bakery',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
    barcode: '1234567890124',
    description: 'Traditional French baguette with a crispy crust and soft interior.'
  },
  {
    id: '6',
    name: 'Chocolate Croissants',
    price: 4.49,
    category: 'Bakery',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
    barcode: '1234567890125',
    description: 'Flaky croissants filled with rich chocolate.'
  },
  {
    id: '7',
    name: 'Fresh Milk',
    price: 5.99,
    category: 'Dairy',
    stock: 60,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800',
    barcode: '2345678901234',
    description: 'Fresh whole milk, rich in calcium and protein.'
  },
  {
    id: '8',
    name: 'Cheddar Cheese',
    price: 6.99,
    category: 'Dairy',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800',
    barcode: '2345678901235',
    description: 'Aged cheddar cheese with a rich, bold flavor.'
  },
];

export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    userId: '1',
    items: [
      { product: mockProducts[0], quantity: 2 },
      { product: mockProducts[3], quantity: 1 }
    ],
    total: 12.99,
    status: 'delivered',
    createdAt: '2024-02-15',
    deliveryAddress: '123 Main St, City',
    paymentMethod: 'Credit Card'
  },
];

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    totalOrders: 5,
    totalSpent: 299.50,
    joinedDate: '2024-01-01'
  },
];
