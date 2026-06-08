/**
 * Verify reCAPTCHA v3 token on server side
 */
export async function verifyRecaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('[recaptcha] RECAPTCHA_SECRET_KEY not set, skipping verification');
    return { success: true, score: 1.0, skipped: true };
  }

  if (!token) {
    console.log('[recaptcha] No token provided, skipping');
    return { success: true, score: 1.0, skipped: true };
  }

  try {
    console.log('[recaptcha] Verifying token:', token.slice(0, 20) + '...');
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }).toString(),
    });

    const data = await response.json();
    console.log('[recaptcha] Google response:', JSON.stringify(data));

    if (!data.success) {
      console.error('[recaptcha] verification failed:', data);
      // Если ошибка browser-error — возможно токен истёк, пропускаем
      if (data['error-codes']?.includes('browser-error')) {
        console.warn('[recaptcha] Browser error, allowing request');
        return { success: true, score: 0.5, warning: 'browser-error' };
      }
      return { success: false, error: 'reCAPTCHA verification failed', codes: data['error-codes'] };
    }

    // reCAPTCHA v3 score: 0.0 (bot) to 1.0 (human)
    const score = data.score || 0;
    console.log('[recaptcha] Score:', score);
    
    if (score < 0.1) {
      console.warn('[recaptcha] very low score:', score);
      return { success: false, error: 'Suspicious activity detected', score };
    }

    return { success: true, score, action: data.action };
  } catch (err) {
    console.error('[recaptcha] error:', err);
    // При ошибке сети — пропускаем, чтобы не ломать UX
    return { success: true, score: 0.5, warning: 'network-error' };
  }
}
