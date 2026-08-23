import { NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Always allow public endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/twilio') || // Twilio webhooks MUST stay public
    pathname.startsWith('/api/auth') ||   // Login/Logout endpoints
    pathname === '/login' ||
    pathname.includes('.')                // Static assets (images, svg, etc.)
  ) {
    return NextResponse.next();
  }

  // 2. Check session token from cookie
  let session = null;
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      session = await verifyToken(token);
    }
  } catch (err) {
    console.error('Middleware token verification error:', err);
    session = null;
  }

  // 3. If no valid session, redirect to login
  if (!session) {
    // If it's an API request (other than twilio/auth), return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. If already logged in and visiting /login, redirect to /
  if (pathname === '/login') {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
