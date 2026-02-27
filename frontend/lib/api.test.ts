const getItem = jest.fn();
const setItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: any[]) => getItem(...args),
  setItem: (...args: any[]) => setItem(...args),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      hostUri: '192.168.1.10:8081',
    },
  },
}));

jest.mock('react-native', () => ({
  NativeModules: {
    SourceCode: {
      scriptURL: 'exp://192.168.1.10:8081',
    },
  },
  Platform: {
    OS: 'android',
  },
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
    (global as any).fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'jwt-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 7,
          username: 'john',
          email: 'john@doe.com',
          role: 'admin',
        }),
      });

    const { authAPI } = await import('./api');
    const result = await authAPI.login('john@doe.com', '123456');

    expect(setItem).toHaveBeenCalledWith('token', 'jwt-token');
    expect(setItem).toHaveBeenCalledWith(
      'user',
      expect.stringContaining('john'),
    );
    expect(result.token).toBe('jwt-token');
    expect(result.user.role).toBe('admin');
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
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          username: 'jane',
          email: 'jane@doe.com',
          role: 'user',
        }),
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

  test('cartAPI.removeFromCart calls delete endpoint with provided id', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok' }),
    });

    const { cartAPI } = await import('./api');
    await cartAPI.removeFromCart('123');

    const [url, options] = (global as any).fetch.mock.calls[0];
    expect(url).toContain('/cart/remove/123');
    expect(options.method).toBe('DELETE');
  });

  test('cartAPI.clearCart sends delete to /cart/clear', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'cleared' }),
    });

    const { cartAPI } = await import('./api');
    await cartAPI.clearCart();

    const [url, options] = (global as any).fetch.mock.calls[0];
    expect(url).toContain('/cart/clear');
    expect(options.method).toBe('DELETE');
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

  test('orderAPI.createOrder posts payload to /orders', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ order: { id: 1 } }),
    });

    const { orderAPI } = await import('./api');
    await orderAPI.createOrder({
      items: [{ product_id: 9, quantity: 2 }],
      payment_method: 'paypal',
      shipping_fee: 5,
    });

    const [url, options] = (global as any).fetch.mock.calls[0];
    expect(url).toContain('/orders');
    expect(options.method).toBe('POST');
    expect(options.body).toContain('payment_method');
    expect(options.body).toContain('product_id');
  });

  test('orderAPI.getMyOrders sends GET to /orders/me', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const { orderAPI } = await import('./api');
    const orders = await orderAPI.getMyOrders();

    const [url, options] = (global as any).fetch.mock.calls[0];
    expect(url).toContain('/orders/me');
    expect(options.method).toBe('GET');
    expect(Array.isArray(orders)).toBe(true);
  });

  test('scannerAPI.lookupByBarcode posts barcode and maps product shape', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        product: {
          id: 4,
          name: 'Orange Juice',
          price: '3.2',
          picture: 'oj.png',
          quantity: 5,
          barcode: '12345',
          category: 'Beverages',
        },
      }),
    });

    const { scannerAPI } = await import('./api');
    const product = await scannerAPI.lookupByBarcode('12345');

    const [url, options] = (global as any).fetch.mock.calls[0];
    expect(url).toContain('/scanner/lookup');
    expect(options.method).toBe('POST');
    expect(options.body).toContain('12345');
    expect(product).toEqual(
      expect.objectContaining({
        id: '4',
        image: 'oj.png',
        stock: 5,
      }),
    );
  });
});
