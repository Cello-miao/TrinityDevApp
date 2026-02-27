const getItem = jest.fn();
const setItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: any[]) => getItem(...args),
  setItem: (...args: any[]) => setItem(...args),
}));

describe('frontend api module', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    getItem.mockResolvedValue(null);
    setItem.mockResolvedValue(undefined);
    (global as any).fetch = jest.fn();
  });

  test('productAPI.getAllProducts transforms backend fields', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 1,
          name: 'Milk',
          price: '4.5',
          category: 'Dairy',
          picture: 'milk.png',
          description: 'fresh',
          barcode: '111',
          quantity: 7,
        },
      ],
    });

    const { productAPI } = await import('./api');
    const products = await productAPI.getAllProducts();

    expect(products[0]).toEqual(
      expect.objectContaining({
        id: '1',
        image: 'milk.png',
        stock: 7,
        price: 4.5,
      }),
    );
  });

  test('authAPI.login stores token and user', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'jwt-token' }),
    });

    const { authAPI } = await import('./api');
    const result = await authAPI.login('john@doe.com', '123456');

    expect(setItem).toHaveBeenCalledWith('token', 'jwt-token');
    expect(setItem).toHaveBeenCalledWith(
      'user',
      expect.stringContaining('john'),
    );
    expect(result.token).toBe('jwt-token');
  });

  test('authAPI.login throws when token missing', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok but no token' }),
    });

    const { authAPI } = await import('./api');

    await expect(authAPI.login('a@a.com', 'p')).rejects.toThrow('Login failed');
  });

  test('authAPI.register calls login after successful registration', async () => {
    (global as any).fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ user: { id: 1 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'after-register-token' }),
      });

    const { authAPI } = await import('./api');
    const result = await authAPI.register('Jane Doe', 'jane@doe.com', '001', 'ppp');

    expect(result.token).toBe('after-register-token');
  });

  test('userAPI.getProfile transforms role and name fields', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 3,
        username: 'adminx',
        email: 'admin@x.com',
        phone_number: '000',
        role: 'admin',
      }),
    });

    const { userAPI } = await import('./api');
    const user = await userAPI.getProfile();

    expect(user).toEqual(
      expect.objectContaining({ id: '3', role: 'admin', name: 'adminx' }),
    );
  });

  test('cartAPI.addToCart sends product_id payload', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, quantity: 2 }),
    });

    const { cartAPI } = await import('./api');
    await cartAPI.addToCart('9', 2);

    const secondArg = (global as any).fetch.mock.calls[0][1];
    expect(secondArg.body).toContain('product_id');
  });

  test('apiRequest includes Authorization header when token exists', async () => {
    getItem.mockResolvedValue('token-abc');
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, name: 'X', price: 1, quantity: 1 }),
    });

    const { productAPI } = await import('./api');
    await productAPI.getProductById('1');

    const secondArg = (global as any).fetch.mock.calls[0][1];
    expect(secondArg.headers.Authorization).toBe('Bearer token-abc');
  });

  test('apiRequest throws backend message on non-ok response', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found from backend' }),
    });

    const { productAPI } = await import('./api');

    await expect(productAPI.getProductById('404')).rejects.toThrow('Not found from backend');
  });
});
