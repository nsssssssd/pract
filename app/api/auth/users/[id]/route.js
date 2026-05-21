import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const { id } = params;
    const data = readData();
    const idx = data.users.findIndex((u) => u.id === Number(id));
    if (idx === -1) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (data.users[idx].id === currentUser.id) {
      return NextResponse.json({ error: 'Нельзя удалить самого себя' }, { status: 400 });
    }

    data.users.splice(idx, 1);
    await writeData(data);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const { id } = params;
    const { role } = await request.json();

    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Неверная роль' }, { status: 400 });
    }

    const data = readData();
    const user = data.users.find((u) => u.id === Number(id));
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    user.role = role;
    await writeData(data);
    return NextResponse.json({ success: true, user });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
