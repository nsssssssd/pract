import { NextResponse } from 'next/server';
import { readData } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { createCode, canResendCode } from '@/lib/verification';
import { sendVerificationCode } from '@/lib/email';
import { sendSmsCode } from '@/lib/sms';
import { parsePhoneNumber } from 'libphonenumber-js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const limit = rateLimit(request, { windowMs: 60_000, max: 5, identifier: 'send-code' });
    if (!limit.success) {
      return NextResponse.json({ error: 'Слишком много запросов. Попробуйте позже.' }, { status: 429 });
    }

    const { target, type, name, mode = 'register' } = await request.json();

    if (!target || !type) {
      return NextResponse.json({ error: 'Укажите target и type' }, { status: 400 });
    }

    if (type === 'email') {
      const email = target.trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
      }

      const data = readData();
      const userExists = data.users?.find((u) => u.email === email);
      if (mode === 'register' && userExists) {
        return NextResponse.json({ error: 'Этот email уже зарегистрирован' }, { status: 409 });
      }
      if (mode === 'login' && !userExists) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
      }

      if (!canResendCode(email, 'email')) {
        return NextResponse.json({ error: 'Подождите минуту перед повторной отправкой' }, { status: 429 });
      }

      const code = await createCode({ target: email, type: 'email', meta: { name } });
      await sendVerificationCode(email, code);

      return NextResponse.json({ success: true, message: 'Код отправлен на email', target: email });
    }

    if (type === 'phone') {
      const phoneParsed = parsePhoneNumber(target, 'RU');
      if (!phoneParsed || !phoneParsed.isValid()) {
        return NextResponse.json({ error: 'Введите корректный номер телефона' }, { status: 400 });
      }
      const phone = phoneParsed.format('E.164');

      const data = readData();
      const userExists = data.users?.find((u) => u.phone === phone);
      if (mode === 'register' && userExists) {
        return NextResponse.json({ error: 'Этот номер уже зарегистрирован' }, { status: 409 });
      }
      if (mode === 'login' && !userExists) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
      }

      if (!canResendCode(phone, 'phone')) {
        return NextResponse.json({ error: 'Подождите минуту перед повторной отправкой' }, { status: 429 });
      }

      const code = await createCode({ target: phone, type: 'phone', meta: { name } });
      await sendSmsCode(phone, code);

      return NextResponse.json({ success: true, message: 'Код отправлен по SMS', target: phone });
    }

    return NextResponse.json({ error: 'Неверный type. Используйте email или phone' }, { status: 400 });
  } catch (err) {
    console.error('[send-code]', err);
    return NextResponse.json({ error: err.message || 'Ошибка отправки' }, { status: 500 });
  }
}
