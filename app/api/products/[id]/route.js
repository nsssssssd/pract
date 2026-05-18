import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await params;
    const data = readData();
    const idx = data.products.findIndex((p) => p.id === parseInt(id));
    if (idx === -1) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const body = await request.json();
    data.products[idx] = { ...data.products[idx], ...body, id: data.products[idx].id };
    writeData(data);
    return NextResponse.json(data.products[idx]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { id } = await params;
    const data = readData();
    data.products = data.products.filter((p) => p.id !== parseInt(id));
    writeData(data);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
