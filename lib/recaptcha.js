/**
 * Verify reCAPTCHA token on server side
 */
export async function verifyRecaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('[recaptcha] RECAPTCHA_SECRET_KEY not set');
    return { success: true, skipped: true };
  }

  if (!token) {
    return { success: false, error: 'Пройдите проверку CAPTCHA' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }).toString(),
    });

    const data = await response.json();

    if (!data.success) {
      console.error('[recaptcha] failed:', data['error-codes']);
      return { success: false, error: 'Проверка CAPTCHA не пройдена' };
    }

    return { success: true, score: data.score };
  } catch (err) {
    console.error('[recaptcha] error:', err);
    return { success: false, error: 'Ошибка проверки CAPTCHA' };
  }
}
