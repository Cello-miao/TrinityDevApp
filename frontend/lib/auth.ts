import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export const login = async (email: string, password: string): Promise<User | null> => {
  try {
    // 模拟API调用
    // 在实际应用中，这里应该调用后端API
    if (email && password) {
      const user: User = {
        id: '1',
        name: 'Customer User',
        email: email,
        phone: '1234567890',
        role: 'customer',
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const register = async (
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<User | null> => {
  try {
    const user: User = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      role: 'customer',
    };
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Register error:', error);
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['user', 'cart']);
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};
