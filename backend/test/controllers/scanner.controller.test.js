jest.mock('../../config/db', () => ({
  query: jest.fn(),
}));

const pool = require('../../config/db');
const {
  findProductByBarcode,
  scanAndAddToCart,
} = require('../../controllers/scanner.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scanner.controller', () => {
  test('findProductByBarcode returns 400 for invalid barcode', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const req = { body: { barcode: '' }, user: { id: 1 } };
    const res = createRes();

    await findProductByBarcode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'BARCODE_REQUIRED' }),
    );
  });

  test('findProductByBarcode returns 404 when product does not exist', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const req = { body: { barcode: '999999' }, user: { id: 2 } };
    const res = createRes();

    await findProductByBarcode(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PRODUCT_NOT_FOUND' }),
    );
  });

  test('findProductByBarcode returns product when found', async () => {
    const product = { id: 10, name: 'Rice', barcode: '1234' };
    pool.query
      .mockResolvedValueOnce({ rows: [product] })
      .mockResolvedValueOnce({ rows: [] });

    const req = { body: { barcode: '1234' }, user: { id: 3 } };
    const res = createRes();

    await findProductByBarcode(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ product }),
    );
  });

  test('scanAndAddToCart returns 400 for invalid quantity', async () => {
    const req = {
      body: { barcode: '1234', quantity: 0 },
      user: { id: 4 },
    };
    const res = createRes();

    await scanAndAddToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INVALID_QUANTITY' }),
    );
  });

  test('scanAndAddToCart adds new cart item successfully', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 7, name: 'Apple', quantity: 10, barcode: 'A777' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99, user_id: 1, product_id: 7, quantity: 2 }] })
      .mockResolvedValueOnce({ rows: [] });

    const req = {
      body: { barcode: 'A777', quantity: 2 },
      user: { id: 1 },
    };
    const res = createRes();

    await scanAndAddToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Product added to cart from barcode scan',
        product: expect.objectContaining({ id: 7, barcode: 'A777' }),
      }),
    );
  });
});
