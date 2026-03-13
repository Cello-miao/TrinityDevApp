jest.mock(
  'axios',
  () => ({
    post: jest.fn(),
  }),
  { virtual: true },
);

jest.mock('../../middleware/auth', () => jest.fn((req, res, next) => next()));

const axios = require('axios');
const paypalRouter = require('../../routes/paypal.routes');

const getRouteHandler = (path, method = 'post') => {
  const layer = paypalRouter.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method],
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  // Route stack contains auth middleware first and async business handler last.
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('paypal routes with mocked PayPal responses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYPAL_CLIENT_ID = 'test-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
  });

  test('POST /create-order returns order id and approval url', async () => {
    const handler = getRouteHandler('/create-order');
    const req = { body: { amount: 12.5, currency: 'EUR' } };
    const res = createRes();

    axios.post
      .mockResolvedValueOnce({ data: { access_token: 'sandbox-access-token' } })
      .mockResolvedValueOnce({
        data: {
          id: 'ORDER-123',
          links: [{ rel: 'approve', href: 'https://paypal.test/approve/ORDER-123' }],
        },
      });

    await handler(req, res);

    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      expect.objectContaining({
        auth: {
          username: 'test-client-id',
          password: 'test-client-secret',
        },
      }),
    );

    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      'https://api-m.sandbox.paypal.com/v2/checkout/orders',
      expect.objectContaining({
        intent: 'CAPTURE',
        application_context: {
          return_url: 'freshcart://payment-success',
          cancel_url: 'freshcart://payment-cancel',
          user_action: 'PAY_NOW',
        },
        purchase_units: [
          expect.objectContaining({
            amount: {
              currency_code: 'EUR',
              value: '12.50',
            },
          }),
        ],
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sandbox-access-token',
        }),
      }),
    );

    expect(res.json).toHaveBeenCalledWith({
      orderId: 'ORDER-123',
      approvalUrl: 'https://paypal.test/approve/ORDER-123',
    });
  });

  test('POST /create-order returns 500 when PayPal order creation fails', async () => {
    const handler = getRouteHandler('/create-order');
    const req = { body: { amount: 20 } };
    const res = createRes();

    axios.post
      .mockResolvedValueOnce({ data: { access_token: 'sandbox-access-token' } })
      .mockRejectedValueOnce(new Error('sandbox unavailable'));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'sandbox unavailable' });
  });

  test('POST /capture-order returns capture status and payment id', async () => {
    const handler = getRouteHandler('/capture-order');
    const req = { body: { orderId: 'ORDER-123' } };
    const res = createRes();

    axios.post
      .mockResolvedValueOnce({ data: { access_token: 'sandbox-access-token' } })
      .mockResolvedValueOnce({
        data: {
          id: 'PAYMENT-456',
          status: 'COMPLETED',
        },
      });

    await handler(req, res);

    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      'https://api-m.sandbox.paypal.com/v2/checkout/orders/ORDER-123/capture',
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sandbox-access-token',
        }),
      }),
    );

    expect(res.json).toHaveBeenCalledWith({
      status: 'COMPLETED',
      paymentId: 'PAYMENT-456',
    });
  });

  test('POST /capture-order returns 500 when capture fails', async () => {
    const handler = getRouteHandler('/capture-order');
    const req = { body: { orderId: 'ORDER-FAILED' } };
    const res = createRes();

    axios.post
      .mockResolvedValueOnce({ data: { access_token: 'sandbox-access-token' } })
      .mockRejectedValueOnce(new Error('capture denied'));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'capture denied' });
  });
});

// ─── isValidRedirectUrl ───────────────────────────────────────────────────────
// isValidRedirectUrl is an internal helper inside paypal.routes.js.
// Its behaviour is exercised through the POST /create-order route handler:
//   • a valid URL is forwarded as-is into application_context
//   • an invalid value causes a fallback to the env-var / hard-coded default

describe('isValidRedirectUrl via POST /create-order', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYPAL_CLIENT_ID = 'test-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
    delete process.env.PAYPAL_RETURN_URL;
    delete process.env.PAYPAL_CANCEL_URL;

    axios.post
      .mockResolvedValueOnce({ data: { access_token: 'tok' } })
      .mockResolvedValueOnce({
        data: {
          id: 'ORD',
          links: [{ rel: 'approve', href: 'https://paypal.test/approve/ORD' }],
        },
      });
  });

  const getApplicationContext = () => {
    const orderCall = axios.post.mock.calls[1];
    return orderCall[1].application_context;
  };

  const handler = (() => {
    // Lazily resolve the handler so beforeEach mocks are set up first
    const paypalRouter = require('../../routes/paypal.routes');
    const layer = paypalRouter.stack.find(
      (e) => e.route && e.route.path === '/create-order' && e.route.methods.post,
    );
    return layer.route.stack[layer.route.stack.length - 1].handle;
  })();

  test('uses provided https:// returnUrl and cancelUrl as-is', async () => {
    const req = {
      body: {
        amount: 10,
        returnUrl: 'https://myapp.com/success',
        cancelUrl: 'https://myapp.com/cancel',
      },
    };
    await handler(req, createRes());

    const ctx = getApplicationContext();
    expect(ctx.return_url).toBe('https://myapp.com/success');
    expect(ctx.cancel_url).toBe('https://myapp.com/cancel');
  });

  test('uses provided http:// returnUrl as-is (http is a valid scheme)', async () => {
    const req = {
      body: {
        amount: 10,
        returnUrl: 'http://dev.local:3000/success',
        cancelUrl: 'http://dev.local:3000/cancel',
      },
    };
    await handler(req, createRes());

    const ctx = getApplicationContext();
    expect(ctx.return_url).toBe('http://dev.local:3000/success');
    expect(ctx.cancel_url).toBe('http://dev.local:3000/cancel');
  });

  test('uses custom app scheme (freshcart://) as-is', async () => {
    const req = {
      body: {
        amount: 10,
        returnUrl: 'freshcart://payment-success',
        cancelUrl: 'freshcart://payment-cancel',
      },
    };
    await handler(req, createRes());

    const ctx = getApplicationContext();
    expect(ctx.return_url).toBe('freshcart://payment-success');
    expect(ctx.cancel_url).toBe('freshcart://payment-cancel');
  });

  test('uses Expo Go exp:// deep-link scheme as-is', async () => {
    const req = {
      body: {
        amount: 10,
        returnUrl: 'exp://192.168.1.10:8081/--/payment-success',
        cancelUrl: 'exp://192.168.1.10:8081/--/payment-cancel',
      },
    };
    await handler(req, createRes());

    const ctx = getApplicationContext();
    expect(ctx.return_url).toBe('exp://192.168.1.10:8081/--/payment-success');
    expect(ctx.cancel_url).toBe('exp://192.168.1.10:8081/--/payment-cancel');
  });

  test('falls back to hard-coded default when returnUrl has no scheme', async () => {
    const req = { body: { amount: 10, returnUrl: 'not-a-url', cancelUrl: 'also-not-a-url' } };
    await handler(req, createRes());

    const ctx = getApplicationContext();
    expect(ctx.return_url).toBe('freshcart://payment-success');
    expect(ctx.cancel_url).toBe('freshcart://payment-cancel');
  });

  test('falls back to hard-coded default when returnUrl is a number', async () => {
    const req = { body: { amount: 10, returnUrl: 42, cancelUrl: 99 } };
    await handler(req, createRes());

    const ctx = getApplicationContext();
    expect(ctx.return_url).toBe('freshcart://payment-success');
    expect(ctx.cancel_url).toBe('freshcart://payment-cancel');
  });

  test('falls back to hard-coded default when returnUrl is null', async () => {
    const req = { body: { amount: 10, returnUrl: null, cancelUrl: null } };
    await handler(req, createRes());

    const ctx = getApplicationContext();
    expect(ctx.return_url).toBe('freshcart://payment-success');
    expect(ctx.cancel_url).toBe('freshcart://payment-cancel');
  });

  test('falls back to env var PAYPAL_RETURN_URL when returnUrl is invalid', async () => {
    process.env.PAYPAL_RETURN_URL = 'https://env-override.com/success';
    process.env.PAYPAL_CANCEL_URL = 'https://env-override.com/cancel';

    const req = { body: { amount: 10 } };
    await handler(req, createRes());

    const ctx = getApplicationContext();
    expect(ctx.return_url).toBe('https://env-override.com/success');
    expect(ctx.cancel_url).toBe('https://env-override.com/cancel');
  });

  test('falls back to hard-coded default when returnUrl is an empty string', async () => {
    const req = { body: { amount: 10, returnUrl: '', cancelUrl: '' } };
    await handler(req, createRes());

    const ctx = getApplicationContext();
    expect(ctx.return_url).toBe('freshcart://payment-success');
    expect(ctx.cancel_url).toBe('freshcart://payment-cancel');
  });
});
