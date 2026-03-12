jest.mock('../../config/db', () => ({ query: jest.fn() }));

const pool = require('../../config/db');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../../controllers/product.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('product.controller', () => {
  test('getAllProducts returns product list', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = createRes();

    await getAllProducts({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getProductById returns 404 when not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: '99' } };
    const res = createRes();

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('createProduct returns 201', async () => {
    const product = { id: 2, name: 'Bread' };
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [product] });
    const req = {
      body: {
        name: 'CrÃ¨me brÃ»lÃ©e',
        price: 5,
        description: 'DÃ©licieux dessert',
        brand: 'FranÃ§ais',
        picture: 'x.png',
        category: 'Ã‰picerie',
        barcode: '1111',
        nutrition_grade: 'A',
        nutritional_info: { label: 'Sucre Ã©levÃ©' },
        quantity: 10,
      },
    };
    const res = createRes();

    await createProduct(req, res);

    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO products'),
      [
        'Crème brûlée',
        5,
        'Délicieux dessert',
        'Français',
        'x.png',
        'Épicerie',
        '1111',
        'A',
        { label: 'Sucre élevé' },
        10,
      ],
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(product);
  });

  test('createProduct returns 409 when barcode already exists', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });
    const req = {
      body: {
        name: 'Milk',
        price: 3,
        barcode: '12345678',
      },
    };
    const res = createRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'DUPLICATE_BARCODE' }),
    );
  });

  test('updateProduct returns 404 when missing', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: '12' }, body: {} };
    const res = createRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateProduct blocks duplicate barcode from another product', async () => {
    pool.query.mockImplementation(async (sql) => {
      if (String(sql).includes('AND id <> $2')) {
        return { rows: [{ id: 99 }] };
      }
      return { rows: [] };
    });

    const req = {
      params: { id: '12' },
      body: { barcode: '12345678' },
    };
    const res = createRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'DUPLICATE_BARCODE' }),
    );
  });

  test('updateProduct allows same product keeping same barcode', async () => {
    const updated = { id: 12, barcode: '12345678' };
    pool.query.mockImplementation(async (sql) => {
      if (String(sql).includes('AND id <> $2')) {
        return { rows: [] };
      }
      if (String(sql).includes('UPDATE products SET')) {
        return { rows: [updated] };
      }
      return { rows: [] };
    });

    const req = {
      params: { id: '12' },
      body: {
        name: 'Milk',
        price: 5,
        description: 'desc',
        brand: 'brand',
        picture: 'x.png',
        category: 'food',
        barcode: '12345678',
        nutrition_grade: 'A',
        nutritional_info: {},
        quantity: 10,
      },
    };
    const res = createRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('deleteProduct returns success message', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 3 }] });
    const req = { params: { id: '3' } };
    const res = createRes();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
