jest.mock('../../config/db', () => ({ query: jest.fn() }));
jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

const pool = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { register, login } = require('../../controllers/auth.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('auth.controller', () => {
  test('register returns 400 if email or username exists', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const req = { body: { email: 'a@a.com', username: 'aaa', password: '123456' } };
    const res = createRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('register creates user successfully', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 2, username: 'bbb', email: 'b@b.com', role: 'user' }] });
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashed');

    const req = {
      body: {
        username: 'bbb',
        email: 'b@b.com',
        password: '123456',
        first_name: 'B',
        last_name: 'B',
        phone_number: '123',
      },
    };
    const res = createRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User registered successfully' }),
    );
  });

  test('login returns 400 for unknown email', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const req = { body: { email: 'x@x.com', password: 'nope' } };
    const res = createRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('login returns 400 for wrong password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hash' }] });
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: 'x@x.com', password: 'bad' } };
    const res = createRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('login returns token on success', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 3, email: 'ok@ok.com', role: 'user', password_hash: 'hash' }],
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token123');

    const req = { body: { email: 'ok@ok.com', password: 'good' } };
    const res = createRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'token123' }),
    );
  });
});
