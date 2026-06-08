import { readData, writeData } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

const VK_APP_ID = process.env.VK_APP_ID;
const VK_APP_SECRET = process.env.VK_APP_SECRET;
const VK_REDIRECT_URI = process.env.VK_REDIRECT_URI || 'https://tulpanomsk55.ru/login';

export async function POST(request) {
  try {
    const { code, device_id, state } = await request.json();

    if (!code || !device_id) {
      return NextResponse.json({ error: 'Отсутствует code или device_id' }, { status: 400 });
    }

    if (!VK_APP_ID || !VK_APP_SECRET) {
      return NextResponse.json({ error: 'VK OAuth не настроен на сервере' }, { status: 500 });
    }

    // Шаг 1: Обменять code на access_token
    const tokenUrl = new URL('https://api.vk.com/oauth/access_token');
    tokenUrl.searchParams.set('client_id', VK_APP_ID);
    tokenUrl.searchParams.set('client_secret', VK_APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', VK_REDIRECT_URI);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('device_id', device_id);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[vk/oauth] token error:', tokenData);
      return NextResponse.json(
        { error: tokenData.error_description || 'Ошибка авторизации VK' },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;
    const vkUserId = String(tokenData.user_id);

    if (!accessToken || !vkUserId) {
      return NextResponse.json({ error: 'Не удалось получить токен VK' }, { status: 400 });
    }

    // Шаг 2: Получить данные пользователя
    const userInfoUrl = new URL('https://api.vk.com/method/users.get');
    userInfoUrl.searchParams.set('user_ids', vkUserId);
    userInfoUrl.searchParams.set('fields', 'photo_200,first_name,last_name');
    userInfoUrl.searchParams.set('access_token', accessToken);
    userInfoUrl.searchParams.set('v', '5.199');

    const userRes = await fetch(userInfoUrl.toString());
    const userData = await userRes.json();

    if (userData.error) {
      console.error('[vk/users.get] error:', userData);
      return NextResponse.json(
        { error: 'Не удалось получить данные пользователя VK' },
        { status: 400 }
      );
    }

    const vkUser = userData.response?.[0];
    if (!vkUser) {
      return NextResponse.json({ error: 'Пользователь VK не найден' }, { status: 404 });
    }

    const vkName = `${vkUser.first_name} ${vkUser.last_name}`.trim();
    const vkAvatar = vkUser.photo_200 || null;

    // Шаг 3: Найти или создать пользователя
    const data = readData();
    if (!data.users) data.users = [];

    let user = data.users.find((u) => u.vkId === vkUserId);

    if (!user) {
      // Создаём нового пользователя
      user = {
        id: Date.now(),
        name: vkName,
        email: null,
        phone: null,
        vkId: vkUserId,
        avatar: vkAvatar,
        password: null,
        role: 'user',
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      await writeData(data);
    } else {
      // Обновляем аватар и имя, если изменились
      let updated = false;
      if (user.name !== vkName) {
        user.name = vkName;
        updated = true;
      }
      if (vkAvatar && user.avatar !== vkAvatar) {
        user.avatar = vkAvatar;
        updated = true;
      }
      if (updated) {
        await writeData(data);
      }
    }

    // Шаг 4: Создать JWT
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      vkId: user.vkId,
      avatar: user.avatar,
      role: user.role,
    };

    const token = signToken(tokenPayload);
    const response = NextResponse.json({
      token,
      user: tokenPayload,
    });

    return setAuthCookie(response, token);
  } catch (err) {
    console.error('[vk/auth]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
