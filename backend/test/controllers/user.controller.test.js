jest.mock('../../config/db', () => ({ query: jest.fn() }));

const pool = require('../../config/db');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getProfile,
  updateProfile,
} = require('../../controllers/user.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('user.controller', () => {
  test('getAllUsers returns rows', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = createRes();

    await getAllUsers({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getUserById returns 404 when user missing', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: '100' } };
    const res = createRes();

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateUserRole returns updated user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, role: 'admin' }] });
    const req = { params: { id: '1' }, body: { role: 'admin' } };
    const res = createRes();

    await updateUserRole(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deleteUser returns success', async () => {
    pool.query.mockResolvedValueOnce({});
    const req = { params: { id: '2' } };
    const res = createRes();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getProfile returns current user profile', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, username: 'u1' }] });
    const req = { user: { id: 1 } };
    const res = createRes();

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: 1, username: 'u1' });
  });

  test('updateProfile returns updated profile', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, username: 'u1' }] });
    const req = {
      user: { id: 1 },
      body: {
        first_name: 'A',
        last_name: 'B',
        phone_number: '123',
        billing_address: 'addr',
        billing_zip_code: '75000',
        billing_city: 'Paris',
        billing_country: 'FR',
      },
    };
    const res = createRes();

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
