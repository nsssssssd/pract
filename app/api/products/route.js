import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = readData();
    return NextResponse.json(data.products);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { name, description, price, unit, emoji, color, image } = await request.json();
    if (!name || !price) {
      return NextResponse.json({ error: 'Название и цена обязательны' }, { status: 400 });
    }

    const data = readData();
    const product = {
      id: Date.now(),
      name,
      description: description || '',
      price: Number(price),
      unit: unit || 'шт',
      emoji: emoji || '🌷',
      color: color || '#F4A7B9',
      image: image || null,
      available: true,
    };
    data.products.push(product);
    writeData(data);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
