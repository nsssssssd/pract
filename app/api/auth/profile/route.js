import bcrypt from 'bcryptjs';
import { readData, writeData } from '@/lib/db';
import { getCurrentUser, signToken, setAuthCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { name, email, currentPassword, newPassword } = await request.json();
    const data = readData();
    const userIdx = data.users.findIndex((u) => u.id === currentUser.id);
    if (userIdx === -1) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const user = data.users[userIdx];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Имя должно быть не короче 2 символов' }, { status: 400 });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
      }
      if (email !== user.email) {
        if (data.users.find((u) => u.email === email && u.id !== user.id)) {
          return NextResponse.json({ error: 'Email уже используется' }, { status: 409 });
        }
        user.email = email.trim().toLowerCase();
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Введите текущий пароль' }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 400 });
      }
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ error: 'Новый пароль минимум 6 символов' }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    data.users[userIdx] = user;
    writeData(data);

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
