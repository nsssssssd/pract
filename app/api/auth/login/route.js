import bcrypt from 'bcryptjs';
import { readData } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { verifyCode } from '@/lib/verification';
import { parsePhoneNumber } from 'libphonenumber-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const limit = rateLimit(request, { windowMs: 60 * 1000, max: 5, identifier: 'login' });
    if (!limit.success) {
      return NextResponse.json({ error: 'Слишком много попыток. Попробуйте позже.' }, { status: 429 });
    }

    const { email, password, phone: rawPhone, code } = await request.json();

    // Phone login (OTP)
    if (rawPhone) {
      const phoneParsed = parsePhoneNumber(rawPhone, 'RU');
      if (!phoneParsed || !phoneParsed.isValid()) {
        return NextResponse.json({ error: 'Введите корректный номер телефона' }, { status: 400 });
      }
      const phone = phoneParsed.format('E.164');

      const data = readData();
      const user = data.users?.find((u) => u.phone === phone);
      if (!user) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 });
      }

      if (!code) {
        return NextResponse.json({ error: 'Введите код подтверждения' }, { status: 400 });
      }

      const codeCheck = await verifyCode({ target: phone, type: 'phone', inputCode: String(code) });
      if (!codeCheck.success) {
        return NextResponse.json({ error: codeCheck.error }, { status: 400 });
      }

      const token = signToken({ id: user.id, name: user.name, phone: user.phone, role: user.role });
      const response = NextResponse.json({
        token,
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      });
      return setAuthCookie(response, token);
    }

    // Email + password login
    if (!email || !password) {
      return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
    }

    const data = readData();
    const user = data.users?.find((u) => u.email === email);
    if (!user) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json({ error: 'Для этого аккаунта вход только по коду' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    const response = NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    return setAuthCookie(response, token);
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
