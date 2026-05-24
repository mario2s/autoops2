import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { ApiError } from './api-error';
import type { SessionUser } from './session';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function validateApiRequest(request: NextRequest): Promise<{ user: SessionUser }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    throw new ApiError(401, 'MISSING_TOKEN', 'Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new ApiError(401, 'MISSING_TOKEN', 'Missing bearer token');
  }

  let payload;
  try {
    const result = await jwtVerify(token, getSecret());
    payload = result.payload;
  } catch {
    throw new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }

  const user: SessionUser = {
    userId: payload.userId as string,
    email: payload.email as string,
    name: payload.name as string,
    role: payload.role as SessionUser['role'],
    status: payload.status as SessionUser['status'],
  };

  if (user.status !== 'active') {
    throw new ApiError(401, 'INACTIVE_ACCOUNT', 'Account is not active');
  }

  return { user };
}

export function requireAdmin(user: SessionUser): void {
  if (user.role !== 'admin') {
    throw new ApiError(403, 'FORBIDDEN', 'Admin access required');
  }
}
