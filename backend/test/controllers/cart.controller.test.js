jest.mock('../../config/db', () => ({ query: jest.fn() }));

const pool = require('../../config/db');
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} = require('../../controllers/cart.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('cart.controller', () => {
  test('getCart returns cart rows', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const req = { user: { id: 1 } };
    const res = createRes();

    await getCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE cart.user_id = $1'), [1]);
  });

  test('addToCart updates existing item', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 10, name: 'P' }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, quantity: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, quantity: 3 }] });

    const req = { user: { id: 1 }, body: { product_id: 10, quantity: 2 } };
    const res = createRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('addToCart inserts new item', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 10, name: 'P' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 9, product_id: 10, quantity: 2 }] });

    const req = { user: { id: 1 }, body: { product_id: 10, quantity: 2 } };
    const res = createRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('removeFromCart returns success', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 5, user_id: 1 }] });
    const req = { user: { id: 1 }, params: { id: '5' } };
    const res = createRes();

    await removeFromCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *',
      ['5', 1],
    );
  });

  test('clearCart returns success', async () => {
    pool.query.mockResolvedValueOnce({});
    const req = { user: { id: 1 } };
    const res = createRes();

    await clearCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getCart returns 500 on query error', async () => {
    pool.query.mockRejectedValueOnce(new Error('db fail'));
    const req = { user: { id: 1 } };
    const res = createRes();

    await getCart(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Server error' }),
    );
  });

  test('removeFromCart returns 500 on query error', async () => {
    pool.query.mockRejectedValueOnce(new Error('db fail'));
    const req = { user: { id: 1 }, params: { id: '5' } };
    const res = createRes();

    await removeFromCart(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Server error' }),
    );
  });
});
