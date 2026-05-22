import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: 'mechanic' | 'admin';
  status: 'pending' | 'active' | 'inactive';
};

export const COOKIE_NAME = 'autoops_token';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as SessionUser['role'],
      status: payload.status as SessionUser['status'],
    };
  } catch {
    return null;
  }
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret());
}
