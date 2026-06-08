const rateLimitMap = new Map();
const loginAttemptsMap = new Map(); // Для защиты от брутфорса

function cleanup() {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(key);
    }
  }
  for (const [key, data] of loginAttemptsMap.entries()) {
    if (now > data.resetTime) {
      loginAttemptsMap.delete(key);
    }
  }
}

export function rateLimit(request, options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const max = options.max || 10;

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const identifier = options.identifier ? `${ip}:${options.identifier}` : ip;

  cleanup();

  const now = Date.now();
  const data = rateLimitMap.get(identifier);

  if (!data || now > data.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true };
  }

  if (data.count >= max) {
    return {
      success: false,
      limit: max,
      remaining: Math.max(0, max - data.count),
      resetTime: data.resetTime,
    };
  }

  data.count += 1;
  return { success: true };
}

// Защита от брутфорса: прогрессивные задержки
export function bruteForceProtection(request, options = {}) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const identifier = options.identifier ? `${ip}:${options.identifier}` : ip;
  const maxAttempts = options.maxAttempts || 5;
  const lockoutWindowMs = options.lockoutWindowMs || 15 * 60 * 1000; // 15 минут

  cleanup();

  const now = Date.now();
  const data = loginAttemptsMap.get(identifier);

  if (!data || now > data.resetTime) {
    loginAttemptsMap.set(identifier, {
      count: 1,
      resetTime: now + lockoutWindowMs,
      lockoutUntil: 0,
    });
    return { success: true, delay: 0 };
  }

  // Если аккаунт заблокирован
  if (data.lockoutUntil && now < data.lockoutUntil) {
    const remainingMs = data.lockoutUntil - now;
    return {
      success: false,
      lockout: true,
      remainingMs,
      message: `Слишком много попыток. Попробуйте через ${Math.ceil(remainingMs / 1000)} сек.`,
    };
  }

  data.count += 1;

  // Прогрессивная задержка
  if (data.count > maxAttempts) {
    const delayMs = Math.min(30000, (data.count - maxAttempts) * 2000);
    return { success: true, delay: delayMs };
  }

  // Блокировка после 10 неудачных попыток
  if (data.count >= 10) {
    data.lockoutUntil = now + lockoutWindowMs;
    return {
      success: false,
      lockout: true,
      remainingMs: lockoutWindowMs,
      message: 'Слишком много неудачных попыток. Аккаунт временно заблокирован на 15 минут.',
    };
  }

  return { success: true, delay: 0 };
}

export function recordFailedAttempt(request, options = {}) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const identifier = options.identifier ? `${ip}:${options.identifier}` : ip;

  cleanup();

  const now = Date.now();
  const data = loginAttemptsMap.get(identifier);

  if (!data || now > data.resetTime) {
    loginAttemptsMap.set(identifier, {
      count: 1,
      resetTime: now + 15 * 60 * 1000,
      lockoutUntil: 0,
    });
  } else {
    data.count += 1;
  }
}

export function resetAttempts(request, options = {}) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const identifier = options.identifier ? `${ip}:${options.identifier}` : ip;
  loginAttemptsMap.delete(identifier);
}
