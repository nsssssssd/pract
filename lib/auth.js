import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

export function setAuthCookie(response, token) {
  response.cookies.set('token', token, COOKIE_OPTIONS);
  return response;
}

export async function getAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value;
}

export function removeAuthCookie(response) {
  response.cookies.set('token', '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function getCurrentUser() {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}
