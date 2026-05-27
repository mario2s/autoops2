import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { validateApiRequest, requireAdmin } from '@/lib/api-auth';
import type { SessionUser } from '@/lib/session';
import { ApiError } from '@/lib/api-error';

process.env.JWT_SECRET = 'test-secret';

describe('api-auth', () => {
  describe('requireAdmin', () => {
    test('does not throw for admin role', () => {
      const user: SessionUser = {
        userId: 'u1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
        status: 'active',
      };
      expect(() => requireAdmin(user)).not.toThrow();
    });

    test('throws for non-admin role', () => {
      const user: SessionUser = {
        userId: 'u1',
        email: 'mech@test.com',
        name: 'Mechanic',
        role: 'mechanic',
        status: 'active',
      };
      expect(() => requireAdmin(user)).toThrow();
      try {
        requireAdmin(user);
      } catch (e) {
        expect((e as ApiError).status).toBe(403);
        expect((e as ApiError).code).toBe('FORBIDDEN');
      }
    });
  });

  describe('validateApiRequest', () => {
    async function createToken(payload: Record<string, unknown>): Promise<string> {
      const secret = new TextEncoder().encode('test-secret');
      return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret);
    }

    test('rejects missing Authorization header', async () => {
      const request = new NextRequest('http://localhost/api', {
        headers: {},
      });
      await expect(validateApiRequest(request)).rejects.toThrow();
      try {
        await validateApiRequest(request);
      } catch (e) {
        expect((e as ApiError).status).toBe(401);
        expect((e as ApiError).code).toBe('MISSING_TOKEN');
      }
    });

    test('rejects empty bearer token', async () => {
      const request = new NextRequest('http://localhost/api', {
        headers: { authorization: 'Bearer ' },
      });
      await expect(validateApiRequest(request)).rejects.toThrow();
      try {
        await validateApiRequest(request);
      } catch (e) {
        expect((e as ApiError).status).toBe(401);
        expect((e as ApiError).code).toBe('MISSING_TOKEN');
      }
    });

    test('rejects invalid token', async () => {
      const request = new NextRequest('http://localhost/api', {
        headers: { authorization: 'Bearer garbage' },
      });
      await expect(validateApiRequest(request)).rejects.toThrow();
      try {
        await validateApiRequest(request);
      } catch (e) {
        expect((e as ApiError).status).toBe(401);
        expect((e as ApiError).code).toBe('INVALID_TOKEN');
      }
    });

    test('rejects token with pending status', async () => {
      const token = await createToken({
        userId: 'u1',
        email: 'test@test.com',
        name: 'Test',
        role: 'mechanic',
        status: 'pending',
      });
      const request = new NextRequest('http://localhost/api', {
        headers: { authorization: `Bearer ${token}` },
      });
      await expect(validateApiRequest(request)).rejects.toThrow();
      try {
        await validateApiRequest(request);
      } catch (e) {
        expect((e as ApiError).status).toBe(401);
        expect((e as ApiError).code).toBe('INACTIVE_ACCOUNT');
      }
    });

    test('accepts valid active token', async () => {
      const token = await createToken({
        userId: 'u1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
        status: 'active',
      });
      const request = new NextRequest('http://localhost/api', {
        headers: { authorization: `Bearer ${token}` },
      });
      const result = await validateApiRequest(request);
      expect(result.user.userId).toBe('u1');
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.role).toBe('admin');
      expect(result.user.status).toBe('active');
    });
  });
});
