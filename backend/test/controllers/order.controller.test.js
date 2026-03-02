jest.mock('../../config/db', () => ({
  connect: jest.fn(),
  query: jest.fn(),
}));

const pool = require('../../config/db');
const { createOrder, getMyOrders } = require('../../controllers/order.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createClient = () => ({
  query: jest.fn(),
  release: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('order.controller', () => {
  test('createOrder returns 400 when payment_method is missing', async () => {
    const client = createClient();
    pool.connect.mockResolvedValue(client);

    const req = {
      user: { id: 1 },
      body: {
        items: [{ product_id: 1, quantity: 1 }],
      },
    };
    const res = createRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'payment_method is required' }),
    );
    expect(client.release).toHaveBeenCalled();
  });

  test('createOrder returns 400 when items missing and cart empty', async () => {
    const client = createClient();
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({});
    pool.connect.mockResolvedValue(client);

    const req = {
      user: { id: 1 },
      body: { payment_method: 'paypal' },
    };
    const res = createRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No items provided and cart is empty' }),
    );
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('createOrder returns 409 when stock is insufficient', async () => {
    const client = createClient();
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ id: 7, name: 'Apple', picture: 'a.png', price: '2.5', quantity: 1 }],
      })
      .mockResolvedValueOnce({});
    pool.connect.mockResolvedValue(client);

    const req = {
      user: { id: 2 },
      body: {
        payment_method: 'paypal',
        items: [{ product_id: 7, quantity: 2 }],
      },
    };
    const res = createRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INSUFFICIENT_STOCK' }),
    );
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('createOrder creates order and clears cart successfully', async () => {
    const client = createClient();
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Milk', picture: 'm.png', price: '4.5', quantity: 10 }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 88, order_number: 'ORD-TEST-1', total_amount: 14 }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 501, order_id: 88, quantity: 2 }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    pool.connect.mockResolvedValue(client);

    const req = {
      user: { id: 3 },
      body: {
        payment_method: 'paypal',
        shipping_fee: 5,
        tax_amount: 0,
        items: [{ product_id: 1, quantity: 2 }],
      },
    };
    const res = createRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Order created successfully',
        order: expect.objectContaining({ id: 88 }),
        items: expect.any(Array),
      }),
    );
    expect(client.query).toHaveBeenCalledWith('DELETE FROM cart WHERE user_id = $1', [3]);
    expect(client.query).toHaveBeenCalledWith('COMMIT');
  });

  test('createOrder rolls back and returns 500 when order item insert fails', async () => {
    const client = createClient();
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Milk', picture: 'm.png', price: '4.5', quantity: 10 }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 90, order_number: 'ORD-TEST-ERR', total_amount: 9 }],
      })
      .mockRejectedValueOnce(new Error('insert item failed'))
      .mockResolvedValueOnce({});
    pool.connect.mockResolvedValue(client);

    const req = {
      user: { id: 5 },
      body: {
        payment_method: 'paypal',
        items: [{ product_id: 1, quantity: 2 }],
      },
    };
    const res = createRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Server error' }),
    );
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  test('getMyOrders returns empty list', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const req = { user: { id: 1 } };
    const res = createRes();

    await getMyOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('getMyOrders returns orders with grouped items', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          { id: 10, order_number: 'ORD-10' },
          { id: 11, order_number: 'ORD-11' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, order_id: 10, quantity: 1 },
          { id: 2, order_id: 10, quantity: 3 },
          { id: 3, order_id: 11, quantity: 2 },
        ],
      });

    const req = { user: { id: 9 } };
    const res = createRes();

    await getMyOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ id: 10, items: expect.arrayContaining([expect.objectContaining({ order_id: 10 })]) }),
      expect.objectContaining({ id: 11, items: expect.arrayContaining([expect.objectContaining({ order_id: 11 })]) }),
    ]);
  });

  test('getMyOrders returns 500 on query error', async () => {
    pool.query.mockRejectedValueOnce(new Error('db down'));
    const req = { user: { id: 7 } };
    const res = createRes();

    await getMyOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Server error' }),
    );
  });
});
