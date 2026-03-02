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
  jest.clearAllMocks();
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
    pool.query.mockResolvedValueOnce({ rows: [product] });
    const req = {
      body: {
        name: 'Bread',
        price: 5,
        description: 'desc',
        brand: 'brand',
        picture: 'x.png',
        category: 'food',
        barcode: '1111',
        nutrition_grade: 'A',
        nutritional_info: {},
        quantity: 10,
      },
    };
    const res = createRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(product);
  });

  test('updateProduct returns 404 when missing', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: '12' }, body: {} };
    const res = createRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deleteProduct returns success message', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 3 }] });
    const req = { params: { id: '3' } };
    const res = createRes();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
