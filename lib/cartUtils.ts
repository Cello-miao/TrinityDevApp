import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';

export const addToCart = async (product: Product, quantity: number = 1): Promise<void> => {
  try {
    const cartStr = await AsyncStorage.getItem('cart');
    let cart: CartItem[] = cartStr ? JSON.parse(cartStr) : [];

    const existingItemIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      // Update quantity if item already exists
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push({ product, quantity });
    }

    await AsyncStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to add to cart:', error);
    throw error;
  }
};

export const getCartItemCount = async (): Promise<number> => {
  try {
    const cartStr = await AsyncStorage.getItem('cart');
    if (!cartStr) return 0;
    
    const cart: CartItem[] = JSON.parse(cartStr);
    return cart.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Failed to get cart count:', error);
    return 0;
  }
};
