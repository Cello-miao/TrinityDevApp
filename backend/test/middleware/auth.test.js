jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));

const jwt = require('jsonwebtoken');
const verifyToken = require('../../middleware/auth');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth middleware', () => {
  test('returns 401 when no token provided', () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is invalid', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const req = { headers: { authorization: 'Bearer bad-token' } };
    const res = createRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('attaches decoded payload and calls next for valid token', () => {
    jwt.verify.mockReturnValue({ id: 1, role: 'user' });
    const req = { headers: { authorization: 'Bearer good-token' } };
    const res = createRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(req.user).toEqual({ id: 1, role: 'user' });
    expect(next).toHaveBeenCalled();
  });
});
