import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, register, logout, getCurrentUser } from '../../lib/auth';
import { authAPI } from '../../lib/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

describe('frontend auth helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('login returns user on success', async () => {
    (authAPI.login as jest.Mock).mockResolvedValue({
      token: 't1',
      user: { id: '1', name: 'u', email: 'u@u.com', role: 'customer' },
    });

    const user = await login('u@u.com', '123456');

    expect(user?.email).toBe('u@u.com');
  });

  test('login returns null on error', async () => {
    (authAPI.login as jest.Mock).mockRejectedValue(new Error('bad'));

    const user = await login('u@u.com', 'bad');

    expect(user).toBeNull();
  });

  test('register returns user on success', async () => {
    (authAPI.register as jest.Mock).mockResolvedValue({
      token: 't2',
      user: { id: '2', name: 'n', email: 'n@n.com', role: 'customer' },
    });

    const user = await register('n', 'n@n.com', '123', 'pass');

    expect(user?.id).toBe('2');
  });

  test('register returns null on error', async () => {
    (authAPI.register as jest.Mock).mockRejectedValue(new Error('failed'));

    const user = await register('n', 'n@n.com', '123', 'pass');

    expect(user).toBeNull();
  });

  test('logout clears storage keys', async () => {
    await logout();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['user', 'cart', 'token']);
  });

  test('getCurrentUser returns parsed user', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: '1', name: 'A', email: 'a@a.com', role: 'customer' }),
    );

    const user = await getCurrentUser();

    expect(user?.name).toBe('A');
  });

  test('getCurrentUser returns null when storage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const user = await getCurrentUser();

    expect(user).toBeNull();
  });
});
