// ==============================================================================
// Linktich Authentication & Session Management
// Uses 'jose' (Web Crypto API) for edge-compatible JWT signing and verification,
// and 'bcryptjs' for password hashing.
// ==============================================================================

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'linktich_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  'linktich-platform-egypt-super-secret-jwt-key-2026-minimum-32-chars'
);

export type UserRole = 'ADMIN' | 'CENTER' | 'TEACHER' | 'STUDENT';

export interface AuthSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  centerId?: string | null;
  teacherId?: string | null;
}

/**
 * Return dashboard redirect route based on role
 */
export function getDashboardRoute(role: UserRole): string {
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

/**
 * Hash raw password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Compare plain password against stored hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Sign JWT session token (Edge-compatible)
 */
export async function signSessionToken(payload: AuthSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify JWT session token (Edge-compatible)
 */
export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthSessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Read current session from cookies in Server Components or Route Handlers
 */
export async function getSession(): Promise<AuthSessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

/**
 * Set HTTP-only secure cookie in a NextResponse
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clear session cookie in a NextResponse
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
