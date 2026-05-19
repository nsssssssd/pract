import { removeAuthCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    return removeAuthCookie(response);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
