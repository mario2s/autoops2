import { apiRequest } from './http';
import { context } from './context';

describe('auth', () => {
  test('AUTH-01 — Login with valid admin credentials', async () => {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'admin@autoops.com', password: 'admin123' },
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.token.length).toBeGreaterThan(0);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.email).toBe('admin@autoops.com');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    context.adminToken = res.body.data.token;
    context.adminUserId = res.body.data.user.id;
  });

  test('AUTH-02 — Login with valid mechanic credentials', async () => {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'mechanic@autoops.com', password: 'mechanic123' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('mechanic');
    context.mechanicToken = res.body.data.token;
    context.mechanicUserId = res.body.data.user.id;
  });

  test('AUTH-03 — Login with second mechanic', async () => {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'mechanic2@autoops.com', password: 'mechanic123' },
    });
    expect(res.status).toBe(200);
    context.mechanic2Token = res.body.data.token;
    context.mechanic2UserId = res.body.data.user.id;
  });

  test('AUTH-04 — Login with pending account', async () => {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'pending@autoops.com', password: 'pending123' },
    });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_NOT_ACTIVE');
  });

  test('AUTH-05 — Login with wrong password', async () => {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'admin@autoops.com', password: 'wrongpassword' },
    });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('AUTH-06 — Login with unknown email', async () => {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'nobody@autoops.com', password: 'test123' },
    });
    expect(res.status).toBe(401);
  });

  test('AUTH-07 — Login with missing fields', async () => {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'admin@autoops.com' },
    });
    expect(res.status).toBe(400);
  });

  test('AUTH-08 — Access protected route without token', async () => {
    const res = await apiRequest('/api/v1/orders');
    expect(res.status).toBe(401);
  });

  test('AUTH-09 — Access protected route with malformed token', async () => {
    const res = await apiRequest('/api/v1/orders', { token: 'not_a_real_token' });
    expect(res.status).toBe(401);
  });
});
