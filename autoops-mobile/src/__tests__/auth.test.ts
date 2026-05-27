import { decodeToken, isExpired } from '@/lib/auth';

describe('auth', () => {
  describe('decodeToken', () => {
    test('returns null for invalid token', () => {
      const result = decodeToken('not-a-jwt');
      expect(result).toBeNull();
    });

    test('decodes valid JWT', () => {
      // Create a simple JWT token (header.payload.signature)
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const token = `${header}.${body}.fake-signature`;

      const result = decodeToken(token);
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user123');
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('isExpired', () => {
    test('returns true for null payload', () => {
      expect(isExpired(null)).toBe(true);
    });

    test('returns true for expired token', () => {
      const payload = {
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) - 10,
      };
      expect(isExpired(payload)).toBe(true);
    });

    test('returns false for valid token', () => {
      const payload = {
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      expect(isExpired(payload)).toBe(false);
    });
  });
});
