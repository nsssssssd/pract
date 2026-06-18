import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = readData();
    const dbUser = data.users.find((u) => u.id === user.id);
    return NextResponse.json({ items: dbUser?.wishlist || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await request.json();
    const data = readData();
    const dbUser = data.users.find((u) => u.id === user.id);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    dbUser.wishlist = Array.isArray(items) ? items : [];
    await writeData(data);
    return NextResponse.json({ items: dbUser.wishlist });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
