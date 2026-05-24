import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = new Set(['/', '/login', '/register']);

function applyCors(res: NextResponse, origin: string | null) {
  // In dev, allow any localhost origin; in prod, set an allowlist via env.
  const allowed =
    origin && (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ? origin
      : null;
  if (allowed) {
    res.headers.set('Access-Control-Allow-Origin', allowed);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, Accept',
    );
    res.headers.set('Access-Control-Max-Age', '86400');
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API v1 routes handle their own Bearer-token auth in route handlers.
  if (pathname.startsWith('/api/v1/')) {
    const origin = request.headers.get('origin');
    if (request.method === 'OPTIONS') {
      return applyCors(new NextResponse(null, { status: 204 }), origin);
    }
    return applyCors(NextResponse.next(), origin);
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
