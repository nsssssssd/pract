import { NextResponse } from 'next/server';
import { verifyCode } from '@/lib/verification';
import { parsePhoneNumber } from 'libphonenumber-js';

export async function POST(request) {
  try {
    const { target, type, code } = await request.json();

    if (!target || !type || !code) {
      return NextResponse.json({ error: 'Укажите target, type и code' }, { status: 400 });
    }

    let normalizedTarget = target.trim().toLowerCase();
    if (type === 'phone') {
      const phoneParsed = parsePhoneNumber(target, 'RU');
      if (phoneParsed && phoneParsed.isValid()) {
        normalizedTarget = phoneParsed.format('E.164');
      }
    }
    const result = await verifyCode({ target: normalizedTarget, type, inputCode: String(code).trim() });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, meta: result.meta });
  } catch (err) {
    console.error('[verify-code]', err);
    return NextResponse.json({ error: err.message || 'Ошибка проверки' }, { status: 500 });
  }
}
