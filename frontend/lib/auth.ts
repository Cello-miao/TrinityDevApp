import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authAPI } from './api';

export const login = async (email: string, password: string): Promise<User | null> => {
  try {
    const { user, token } = await authAPI.login(email, password);
    return user;
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
    console.log('Attempting to register:', { name, email, phone });
    const { user, token } = await authAPI.register(name, email, phone, password);
    console.log('Registration successful:', user);
    return user;
  } catch (error) {
    console.error('Register error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['user', 'cart', 'token']);
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
