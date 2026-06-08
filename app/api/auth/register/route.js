import bcrypt from 'bcryptjs';
import { readData, writeData } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { verifyCode } from '@/lib/verification';
import { parsePhoneNumber } from 'libphonenumber-js';
import { NextResponse } from 'next/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const limit = rateLimit(request, { windowMs: 60 * 1000, max: 5, identifier: 'register' });
    if (!limit.success) {
      return NextResponse.json({ error: 'Слишком много попыток. Попробуйте позже.' }, { status: 429 });
    }

    const { name, email, password, phone: rawPhone, code, type } = await request.json();

    if (!name || !code || !type) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Имя должно быть не короче 2 символов' }, { status: 400 });
    }

    const data = readData();
    if (!data.users) data.users = [];

    if (type === 'email') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Заполните email и пароль' }, { status: 400 });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
      }
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'Пароль должен быть не короче 6 символов' }, { status: 400 });
      }
      if (data.users.find((u) => u.email === normalizedEmail)) {
        return NextResponse.json({ error: 'Email уже зарегистрирован' }, { status: 409 });
      }

      // Verify code
      const codeCheck = await verifyCode({ target: normalizedEmail, type: 'email', inputCode: String(code) });
      if (!codeCheck.success) {
        return NextResponse.json({ error: codeCheck.error }, { status: 400 });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = {
        id: Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        phone: null,
        role: 'user',
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      await writeData(data);

      const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
      const response = NextResponse.json(
        { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
        { status: 201 }
      );
      return setAuthCookie(response, token);
    }

    if (type === 'phone') {
      if (!rawPhone) {
        return NextResponse.json({ error: 'Укажите номер телефона' }, { status: 400 });
      }
      const phoneParsed = parsePhoneNumber(rawPhone, 'RU');
      if (!phoneParsed || !phoneParsed.isValid()) {
        return NextResponse.json({ error: 'Введите корректный номер телефона' }, { status: 400 });
      }
      const phone = phoneParsed.format('E.164');

      if (data.users.find((u) => u.phone === phone)) {
        return NextResponse.json({ error: 'Этот номер уже зарегистрирован' }, { status: 409 });
      }

      // Verify code
      const codeCheck = await verifyCode({ target: phone, type: 'phone', inputCode: String(code) });
      if (!codeCheck.success) {
        return NextResponse.json({ error: codeCheck.error }, { status: 400 });
      }

      // Phone users can optionally set a password; if not provided, store null
      let hashed = null;
      if (password && typeof password === 'string' && password.length >= 6) {
        hashed = await bcrypt.hash(password, 10);
      }

      const user = {
        id: Date.now(),
        name: name.trim(),
        email: null,
        phone,
        password: hashed,
        role: 'user',
        emailVerified: false,
        phoneVerified: true,
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      await writeData(data);

      const token = signToken({ id: user.id, name: user.name, phone: user.phone, role: user.role });
      const response = NextResponse.json(
        { token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } },
        { status: 201 }
      );
      return setAuthCookie(response, token);
    }

    return NextResponse.json({ error: 'Неверный type. Используйте email или phone' }, { status: 400 });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
