jest.mock('../../middleware/auth', () => jest.fn((req, res, next) => next()));

jest.mock('../../controllers/scanner.controller', () => ({
  findProductByBarcode: jest.fn(async (req, res) => res.status(200).json({ message: 'lookup ok' })),
  scanAndAddToCart: jest.fn(async (req, res) => res.status(200).json({ message: 'add-to-cart ok' })),
}));

const verifyToken = require('../../middleware/auth');
const {
  findProductByBarcode,
  scanAndAddToCart,
} = require('../../controllers/scanner.controller');
const scannerRouter = require('../../routes/scanner.routes');

const getRouteLayer = (path, method = 'post') => {
  const layer = scannerRouter.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method],
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  return layer.route.stack;
};

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('scanner routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /lookup invokes barcode lookup controller', async () => {
    const stack = getRouteLayer('/lookup');
    const handler = stack[stack.length - 1].handle;
    const req = { body: { barcode: '123456' } };
    const res = createRes();

    await handler(req, res);

    expect(findProductByBarcode).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'lookup ok' });
  });

  test('POST /add-to-cart passes through auth middleware then controller', async () => {
    const stack = getRouteLayer('/add-to-cart');
    const authMiddleware = stack[0].handle;
    const handler = stack[stack.length - 1].handle;

    const req = { body: { barcode: '123456', quantity: 1 }, user: { id: 1 } };
    const res = createRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);
    await handler(req, res);

    expect(verifyToken).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(scanAndAddToCart).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'add-to-cart ok' });
  });
});
