import { jwtVerify } from 'jose';
import { createSessionToken, type SessionUser } from '@/lib/session';

process.env.JWT_SECRET = 'test-secret';

describe('session', () => {
  describe('createSessionToken', () => {
    test('creates a token string', async () => {
      const user: SessionUser = {
        userId: 'u1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'mechanic',
        status: 'active',
      };
      const token = await createSessionToken(user);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('token can be verified and contains user data', async () => {
      const user: SessionUser = {
        userId: 'u1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'mechanic',
        status: 'active',
      };
      const token = await createSessionToken(user);
      const secret = new TextEncoder().encode('test-secret');
      const { payload } = await jwtVerify(token, secret);
      expect(payload.userId).toBe('u1');
      expect(payload.email).toBe('test@test.com');
      expect(payload.name).toBe('Test User');
      expect(payload.role).toBe('mechanic');
      expect(payload.status).toBe('active');
    });

    test('token has expiry set', async () => {
      const user: SessionUser = {
        userId: 'u1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
      };
      const token = await createSessionToken(user);
      const secret = new TextEncoder().encode('test-secret');
      const { payload } = await jwtVerify(token, secret);
      expect(typeof payload.exp).toBe('number');
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });
});
