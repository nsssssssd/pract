import bcrypt from 'bcryptjs';
import { readData } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const limit = rateLimit(request, { windowMs: 60 * 1000, max: 5, identifier: 'login' });
    if (!limit.success) {
      return NextResponse.json({ error: 'Слишком много попыток. Попробуйте позже.' }, { status: 429 });
    }

    const { email, password } = await request.json();
    const data = readData();
    const user = data.users.find((u) => u.email === email);
    if (!user) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const response = NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    return setAuthCookie(response, token);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
