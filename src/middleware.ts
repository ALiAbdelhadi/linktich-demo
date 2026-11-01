// ==============================================================================
// Linktich Next.js Edge Middleware - Role-Based Access Control (RBAC)
// Protects dashboards and redirects authenticated users to their correct view
// ==============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'linktich_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  'linktich-platform-egypt-super-secret-jwt-key-2026-minimum-32-chars'
);

type UserRole = 'ADMIN' | 'CENTER' | 'TEACHER' | 'STUDENT';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'CENTER':
      return '/center-dashboard';
    case 'TEACHER':
      return '/teacher-dashboard';
    case 'STUDENT':
      return '/student-dashboard';
    case 'ADMIN':
      return '/center-dashboard';
    default:
      return '/login';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Read session cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let user: TokenPayload | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload as unknown as TokenPayload;
    } catch {
      // Invalid or expired token
      user = null;
    }
  }

  // 2. Auth Pages Handling (/login, /signup)
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  if (isAuthPage) {
    if (user) {
      // User is already logged in, redirect to their role dashboard
      return NextResponse.redirect(new URL(getRoleDashboard(user.role), request.url));
    }
    return NextResponse.next();
  }

  // 3. Root Path: logged-in users go to their dashboard, visitors see the landing page
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL(getRoleDashboard(user.role), request.url));
    }
    return NextResponse.next();
  }

  // 4. Subscription Renewal Page Handling
  if (pathname.startsWith('/renew-subscription')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(loginUrl);
    }
    // Students do not have subscription fees
    if (user.role === 'STUDENT') {
      return NextResponse.redirect(new URL('/student-dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 5. Role-Based Protected Routes Configuration
  const isCenterRoute = pathname.startsWith('/center-dashboard');
  const isTeacherRoute = pathname.startsWith('/teacher-dashboard');
  const isStudentRoute = pathname.startsWith('/student-dashboard');

  if (isCenterRoute || isTeacherRoute || isStudentRoute) {
    // Case A: Unauthenticated user -> redirect to /login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(loginUrl);
    }

    // Case B: Center Dashboard Protection
    if (isCenterRoute && user.role !== 'CENTER' && user.role !== 'ADMIN') {
      // Unauthorized role -> redirect to their own role's dashboard
      return NextResponse.redirect(new URL(getRoleDashboard(user.role), request.url));
    }

    // Case C: Teacher Dashboard Protection
    if (isTeacherRoute && user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      // Unauthorized role -> redirect to their own role's dashboard
      return NextResponse.redirect(new URL(getRoleDashboard(user.role), request.url));
    }

    // Case D: Student Dashboard Protection
    if (isStudentRoute && user.role !== 'STUDENT' && user.role !== 'ADMIN') {
      // Center and Teacher accounts have their own dedicated views
      return NextResponse.redirect(new URL(getRoleDashboard(user.role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/renew-subscription/:path*',
    '/center-dashboard/:path*',
    '/teacher-dashboard/:path*',
    '/student-dashboard/:path*',
  ],
};
