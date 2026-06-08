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
    return { success: false, error: 'Missing reCAPTCHA token' };
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
      console.error('[recaptcha] verification failed:', data);
      return { success: false, error: 'reCAPTCHA verification failed', codes: data['error-codes'] };
    }

    // reCAPTCHA v3 score: 0.0 (bot) to 1.0 (human)
    // Threshold 0.5 is recommended by Google
    const score = data.score || 0;
    if (score < 0.3) {
      console.warn('[recaptcha] low score:', score);
      return { success: false, error: 'Suspicious activity detected', score };
    }

    return { success: true, score, action: data.action };
  } catch (err) {
    console.error('[recaptcha] error:', err);
    return { success: false, error: 'reCAPTCHA verification error' };
  }
}
