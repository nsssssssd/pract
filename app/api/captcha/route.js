import { generateCaptcha } from '@/lib/captcha';
import { NextResponse } from 'next/server';

export async function GET() {
  const captcha = generateCaptcha();
  return NextResponse.json(captcha);
}
