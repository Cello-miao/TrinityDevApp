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
