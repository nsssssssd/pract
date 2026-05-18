import bcrypt from 'bcryptjs';
import { readData, writeData } from '@/lib/db';
import { getCurrentUser, signToken, setAuthCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { name, email, currentPassword, newPassword } = await request.json();
    const data = readData();
    const userIdx = data.users.findIndex((u) => u.id == currentUser.id);
    if (userIdx === -1) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const user = data.users[userIdx];

    if (email && email !== user.email) {
      if (data.users.find((u) => u.email === email && u.id != user.id)) {
        return NextResponse.json({ error: 'Email уже используется' }, { status: 409 });
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
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Новый пароль минимум 8 символов' }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (name) user.name = name;
    if (email) user.email = email;

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
