import { removeAuthCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  return removeAuthCookie(response);
}
