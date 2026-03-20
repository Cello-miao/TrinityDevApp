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
          brand: 'Lactel',
          category: 'Dairy',
          picture: 'milk.png',
          description: 'fresh',
          barcode: '111',
          quantity: 7,
        },
      ],
    });

    const { productAPI } = await import('../../lib/api');
    const products = await productAPI.getAllProducts();

    expect(products[0]).toEqual(
      expect.objectContaining({
        id: '1',
        image: 'milk.png',
        stock: 7,
        price: 4.5,
        brand: 'Lactel',
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

    const { authAPI } = await import('../../lib/api');
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

    const { authAPI } = await import('../../lib/api');

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

    const { authAPI } = await import('../../lib/api');
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

    const { userAPI } = await import('../../lib/api');
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

    const { cartAPI } = await import('../../lib/api');
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

    const { cartAPI } = await import('../../lib/api');
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

    const { cartAPI } = await import('../../lib/api');
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

    const { productAPI } = await import('../../lib/api');
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

    const { productAPI } = await import('../../lib/api');

    await expect(productAPI.getProductById('404')).rejects.toThrow('Not found from backend');
  });

  test('orderAPI.createOrder posts payload to /orders', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ order: { id: 1 } }),
    });

    const { orderAPI } = await import('../../lib/api');
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

    const { orderAPI } = await import('../../lib/api');
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
          brand: 'Tropicana',
          picture: 'oj.png',
          quantity: 5,
          barcode: '12345',
          category: 'Beverages',
        },
      }),
    });

    const { scannerAPI } = await import('../../lib/api');
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
        brand: 'Tropicana',
      }),
    );
  });
});

// ─── getApiBaseUrl HTTPS URL construction ────────────────────────────────────
// Each test uses jest.resetModules() + jest.doMock() so the api module is
// re-evaluated with different environment mocks, exercising every branch of
// getApiBaseUrl() and verifying all generated base URLs use HTTPS.

// ─── getApiBaseUrl HTTPS URL construction ────────────────────────────────────
// Jest global __DEV__ is set to false (production).
//
// "prod" tests stay at the outer level and exercise the two reachable code
// paths in production:  EXPO_PUBLIC_API_BASE_URL override, and the hard-coded
// production server URL.
//
// "dev environment only" tests are grouped in a nested describe which
// temporarily sets __DEV__ = true so the host-inference branches can still be
// covered without changing the global test environment.

describe('getApiBaseUrl HTTPS URL construction', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    // Always restore prod default in case a nested test changed it.
    (global as any).__DEV__ = false;
  });

  // ── Production tests (__DEV__ = false, the Jest global default) ───────────

  test('uses EXPO_PUBLIC_API_BASE_URL and strips trailing slash', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://custom.server.com/api/';
    jest.doMock('expo-constants', () => ({ __esModule: true, default: { expoConfig: {} } }));
    jest.doMock('react-native', () => ({ NativeModules: {}, Platform: { OS: 'ios' } }));

    const { API_BASE_URL } = await import('../../lib/api');

    expect(API_BASE_URL).toBe('https://custom.server.com/api');
  });

  test('EXPO_PUBLIC_API_BASE_URL without trailing slash is returned unchanged', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://prod.example.com/api';
    jest.doMock('expo-constants', () => ({ __esModule: true, default: { expoConfig: {} } }));
    jest.doMock('react-native', () => ({ NativeModules: {}, Platform: { OS: 'ios' } }));

    const { API_BASE_URL } = await import('../../lib/api');

    expect(API_BASE_URL).toBe('https://prod.example.com/api');
  });

  test('returns the production HTTPS base URL when no env var is set', async () => {
    jest.doMock('expo-constants', () => ({ __esModule: true, default: { expoConfig: {} } }));
    jest.doMock('react-native', () => ({ NativeModules: {}, Platform: { OS: 'ios' } }));

    const { API_BASE_URL } = await import('../../lib/api');

    expect(API_BASE_URL).toBe('https://13.37.46.130/api');
    expect(API_BASE_URL).toMatch(/^https:\/\//);
  });

  // ── Dev-only tests (__DEV__ = true temporarily) ───────────────────────────
  // These host-inference branches are only reachable in development builds.
  // Each test flips __DEV__ to true, imports the module (which calls
  // getApiBaseUrl() at load time), then the outer afterEach restores false.

  const devOnlyDescribe =
    process.env.RUN_DEV_ONLY_TESTS === 'true' ? describe : describe.skip;

  devOnlyDescribe('[dev environment only] host-inference URL branches', () => {
    const loadApiWith = async (
      hostUri: string | undefined,
      scriptURL: string | undefined,
      platform: string,
    ) => {
      jest.doMock('expo-constants', () => ({
        __esModule: true,
        default: {
          expoConfig: hostUri !== undefined ? { hostUri } : {},
        },
      }));
      jest.doMock('react-native', () => ({
        NativeModules: scriptURL !== undefined ? { SourceCode: { scriptURL } } : { SourceCode: {} },
        Platform: { OS: platform },
      }));
      return import('../../lib/api');
    };

    beforeEach(() => {
      (global as any).__DEV__ = true;
    });

    afterEach(() => {
      (global as any).__DEV__ = false;
    });

    test('infers https URL from Expo hostUri', async () => {
      const { API_BASE_URL } = await loadApiWith('10.0.0.5:8081', undefined, 'ios');

      expect(API_BASE_URL).toBe('https://10.0.0.5:3443/api');
    });

    test('infers https URL from scriptURL when hostUri is absent', async () => {
      const { API_BASE_URL } = await loadApiWith(undefined, 'exp://192.168.1.50:8081', 'ios');

      expect(API_BASE_URL).toBe('https://192.168.1.50:3443/api');
    });

    test('scriptURL with http scheme is still parsed to infer host', async () => {
      const { API_BASE_URL } = await loadApiWith(undefined, 'http://172.16.0.1:8081', 'ios');

      expect(API_BASE_URL).toBe('https://172.16.0.1:3443/api');
    });

    test('falls back to https://10.0.2.2:3443/api on Android when no hints', async () => {
      const { API_BASE_URL } = await loadApiWith(undefined, undefined, 'android');

      expect(API_BASE_URL).toBe('https://10.0.2.2:3443/api');
    });

    test('falls back to https://localhost:3443/api on non-Android when no hints', async () => {
      const { API_BASE_URL } = await loadApiWith(undefined, undefined, 'ios');

      expect(API_BASE_URL).toBe('https://localhost:3443/api');
    });

    test('every resolved dev base URL starts with https://', async () => {
      const cases: [string | undefined, string | undefined, string][] = [
        ['192.168.1.2:8081', undefined, 'ios'],
        [undefined, 'exp://192.168.1.3:8081', 'ios'],
        [undefined, undefined, 'android'],
        [undefined, undefined, 'ios'],
      ];

      for (const [hostUri, scriptURL, platform] of cases) {
        jest.resetModules();
        const { API_BASE_URL } = await loadApiWith(hostUri, scriptURL, platform);
        expect(API_BASE_URL).toMatch(/^https:\/\//);
      }
    });
  });
});
