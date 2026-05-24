import { apiRequest, containsPasswordHash } from './http';
import { context } from './context';

describe('users', () => {
  test('USR-01 — List users (admin)', async () => {
    const res = await apiRequest('/api/v1/users', { token: context.adminToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(containsPasswordHash(res.body)).toBe(false);
    for (const u of res.body.data) {
      expect(u).toHaveProperty('id');
      expect(u).toHaveProperty('name');
      expect(u).toHaveProperty('email');
      expect(u).toHaveProperty('role');
      expect(u).toHaveProperty('status');
      expect(u).toHaveProperty('createdAt');
    }
  });

  test('USR-02 — List users (mechanic — forbidden)', async () => {
    const res = await apiRequest('/api/v1/users', { token: context.mechanicToken });
    expect(res.status).toBe(403);
  });

  test('USR-03 — List users filtered by status', async () => {
    const res = await apiRequest('/api/v1/users?status=pending', {
      token: context.adminToken,
    });
    expect(res.status).toBe(200);
    for (const u of res.body.data) {
      expect(u.status).toBe('pending');
    }
  });
});
