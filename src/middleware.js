import { NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check session token from cookie
  let session = null;
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      session = await verifyToken(token);
    }
  } catch (err) {
    session = null;
  }

  // If not authenticated, redirect to /login
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Explicitly target ONLY the CRM dashboard routes that require protection
// This guarantees that /login, /api/twilio/*, /api/auth/*, and all static assets are NEVER intercepted
export const config = {
  matcher: [
    '/',
    '/calls/:path*',
    '/customers/:path*',
    '/simulate/:path*',
    '/export/:path*',
    '/api/calls/:path*',
    '/api/customers/:path*',
    '/api/analytics/:path*',
    '/api/simulate/:path*',
  ],
};
