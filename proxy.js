import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(secret);

const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Apply security headers to all responses
  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Protected routes
  const isProtected = pathname.startsWith('/profile');
  const isAdmin = pathname.startsWith('/admin');

  if (!isProtected && !isAdmin) {
    return response;
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (isAdmin && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
