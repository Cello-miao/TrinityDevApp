const authorizeRoles = require('./roles');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('roles middleware', () => {
  test('denies access when role is not allowed', () => {
    const middleware = authorizeRoles('admin');
    const req = { user: { role: 'user' } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows access when role is allowed', () => {
    const middleware = authorizeRoles('admin', 'manager');
    const req = { user: { role: 'manager' } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
