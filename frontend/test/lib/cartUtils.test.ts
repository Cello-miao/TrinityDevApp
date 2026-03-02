import { addToCart, getCartItemCount } from '../../lib/cartUtils';
import { Product } from '../../types';

const storage: Record<string, string | null> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => storage[key] ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    storage[key] = value;
  }),
}));

const mockProduct: Product = {
  id: 'p1',
  name: 'Milk',
  price: 3.5,
  category: 'Dairy',
  image: 'milk.png',
  description: 'Fresh milk',
  barcode: '12345678',
  stock: 20,
};

beforeEach(() => {
  storage.cart = null;
  jest.clearAllMocks();
});

describe('cartUtils', () => {
  test('addToCart creates new cart item when cart is empty', async () => {
    await addToCart(mockProduct, 2);

    const cart = JSON.parse(storage.cart as string);
    expect(cart).toHaveLength(1);
    expect(cart[0].product.id).toBe('p1');
    expect(cart[0].quantity).toBe(2);
  });

  test('addToCart increments quantity when item exists', async () => {
    storage.cart = JSON.stringify([{ product: mockProduct, quantity: 1 }]);

    await addToCart(mockProduct, 3);

    const cart = JSON.parse(storage.cart as string);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(4);
  });

  test('getCartItemCount returns total quantity', async () => {
    storage.cart = JSON.stringify([
      { product: mockProduct, quantity: 2 },
      { product: { ...mockProduct, id: 'p2' }, quantity: 4 },
    ]);

    const count = await getCartItemCount();
    expect(count).toBe(6);
  });

  test('getCartItemCount returns 0 for empty cart', async () => {
    const count = await getCartItemCount();
    expect(count).toBe(0);
  });
});
