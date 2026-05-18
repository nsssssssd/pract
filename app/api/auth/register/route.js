import bcrypt from 'bcryptjs';
import { readData, writeData } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
    }

    const data = readData();
    if (data.users.find((u) => u.email === email)) {
      return NextResponse.json({ error: 'Email уже зарегистрирован' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now(),
      name,
      email,
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
