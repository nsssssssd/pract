/**
 * SMSC.ru integration
 * Docs: https://smsc.ru/api/
 */

export async function sendSmsCode(phone, code) {
  const login = process.env.SMSC_LOGIN;
  const password = process.env.SMSC_PASSWORD;

  if (!login || !password) {
    console.error('[SMS] SMSC credentials not configured');
    throw new Error('SMS-сервис не настроен');
  }

  const message = `Код подтверждения: ${code}. Действителен 10 минут.`;
  const url = new URL('https://smsc.ru/sys/send.php');
  url.searchParams.set('login', login);
  url.searchParams.set('psw', password);
  url.searchParams.set('phones', phone);
  url.searchParams.set('mes', message);
  url.searchParams.set('fmt', '3'); // JSON response
  url.searchParams.set('charset', 'utf-8');

  console.log('[SMS] Request URL:', url.toString().replace(password, '***'));

  const res = await fetch(url.toString());
  const data = await res.json();

  console.log('[SMS] Response:', JSON.stringify(data));

  if (data.error) {
    console.error('[SMS] SMSC error:', data.error);
    throw new Error(`Ошибка SMS: ${data.error}`);
  }

  console.log('[SMS] Sent to', phone, '—', data);
  return data;
}
