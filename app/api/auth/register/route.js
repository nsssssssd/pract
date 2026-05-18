import bcrypt from 'bcryptjs';
import { readData, writeData } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Имя должно быть не короче 2 символов' }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Пароль должен быть не короче 6 символов' }, { status: 400 });
    }

    const data = readData();
    if (data.users.find((u) => u.email === email)) {
      return NextResponse.json({ error: 'Email уже зарегистрирован' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    writeData(data);

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const response = NextResponse.json(
      { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
    return setAuthCookie(response, token);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
