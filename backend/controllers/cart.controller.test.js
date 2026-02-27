jest.mock('../config/db', () => ({ query: jest.fn() }));

const pool = require('../config/db');
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} = require('./cart.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('cart.controller', () => {
  test('getCart returns cart rows', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const req = { user: { id: 1 } };
    const res = createRes();

    await getCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('addToCart updates existing item', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 7, quantity: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, quantity: 3 }] });

    const req = { user: { id: 1 }, body: { product_id: 10, quantity: 2 } };
    const res = createRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('addToCart inserts new item', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 9, product_id: 10, quantity: 2 }] });

    const req = { user: { id: 1 }, body: { product_id: 10, quantity: 2 } };
    const res = createRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('removeFromCart returns success', async () => {
    pool.query.mockResolvedValueOnce({});
    const req = { user: { id: 1 }, params: { id: '5' } };
    const res = createRes();

    await removeFromCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('clearCart returns success', async () => {
    pool.query.mockResolvedValueOnce({});
    const req = { user: { id: 1 } };
    const res = createRes();

    await clearCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
