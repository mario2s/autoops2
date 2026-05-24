import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = new Set(['/', '/login', '/register']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API v1 routes handle their own Bearer-token auth in route handlers.
  if (pathname.startsWith('/api/v1/')) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('autoops_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const status = payload.status as string;

    if (status === 'pending' || status === 'inactive') {
      const url = new URL('/login', request.url);
      url.searchParams.set('locked', '1');
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next|static|favicon\\.ico).*)'],
};
