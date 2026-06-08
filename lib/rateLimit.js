const rateLimitMap = new Map();
const loginAttemptsMap = new Map(); // По IP
const emailAttemptsMap = new Map(); // По email

function cleanup() {
  const now = Date.now();
  for (const map of [rateLimitMap, loginAttemptsMap, emailAttemptsMap]) {
    for (const [key, data] of map.entries()) {
      if (now > data.resetTime) {
        map.delete(key);
      }
    }
  }
}

export function rateLimit(request, options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 5; // 5 запросов в минуту

  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
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
      remaining: 0,
      resetTime: data.resetTime,
      message: `Слишком много попыток. Попробуйте через ${Math.ceil((data.resetTime - now) / 1000)} сек.`,
    };
  }

  data.count += 1;
  return { success: true };
}

// Защита от брутфорса по IP
export function bruteForceProtection(request, options = {}) {
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
  const identifier = options.identifier ? `${ip}:${options.identifier}` : ip;
  const maxAttempts = options.maxAttempts || 3;

  cleanup();

  const now = Date.now();
  const data = loginAttemptsMap.get(identifier);

  if (!data || now > data.resetTime) {
    loginAttemptsMap.set(identifier, {
      count: 1,
      resetTime: now + 30 * 60 * 1000, // 30 минут
      lockoutUntil: 0,
    });
    return { success: true, delay: 0 };
  }

  // Если заблокирован
  if (data.lockoutUntil && now < data.lockoutUntil) {
    const remainingMs = data.lockoutUntil - now;
    return {
      success: false,
      lockout: true,
      remainingMs,
      message: `Слишком много попыток. Попробуйте через ${Math.ceil(remainingMs / 60000)} мин.`,
    };
  }

  data.count += 1;

  // Прогрессивная задержка: 1с, 2с, 4с, 8с, 16с...
  if (data.count > maxAttempts) {
    const delayMs = Math.min(60000, Math.pow(2, data.count - maxAttempts) * 1000);
    return { success: true, delay: delayMs };
  }

  // Блокировка после 10 попыток на 30 минут
  if (data.count >= 10) {
    data.lockoutUntil = now + 30 * 60 * 1000;
    return {
      success: false,
      lockout: true,
      remainingMs: 30 * 60 * 1000,
      message: 'Слишком много неудачных попыток. Вход заблокирован на 30 минут.',
    };
  }

  return { success: true, delay: 0 };
}

// Защита от брутфорса по email (независимо от IP)
export function emailBruteForceProtection(email) {
  if (!email) return { success: true };

  cleanup();

  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const data = emailAttemptsMap.get(normalizedEmail);

  if (!data || now > data.resetTime) {
    emailAttemptsMap.set(normalizedEmail, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 час
      lockoutUntil: 0,
    });
    return { success: true };
  }

  if (data.lockoutUntil && now < data.lockoutUntil) {
    const remainingMs = data.lockoutUntil - now;
    return {
      success: false,
      message: `Слишком много попыток для ${email}. Попробуйте через ${Math.ceil(remainingMs / 60000)} мин.`,
    };
  }

  data.count += 1;

  // Блокировка email после 5 попыток на 1 час
  if (data.count >= 5) {
    data.lockoutUntil = now + 60 * 60 * 1000;
    return {
      success: false,
      message: `Слишком много попыток для ${email}. Вход заблокирован на 1 час.`,
    };
  }

  return { success: true };
}

export function recordFailedAttempt(request, options = {}) {
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
  const identifier = options.identifier ? `${ip}:${options.identifier}` : ip;

  cleanup();

  const now = Date.now();
  const data = loginAttemptsMap.get(identifier);

  if (!data || now > data.resetTime) {
    loginAttemptsMap.set(identifier, {
      count: 1,
      resetTime: now + 30 * 60 * 1000,
      lockoutUntil: 0,
    });
  } else {
    data.count += 1;
  }
}

export function recordEmailFailedAttempt(email) {
  if (!email) return;

  cleanup();

  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const data = emailAttemptsMap.get(normalizedEmail);

  if (!data || now > data.resetTime) {
    emailAttemptsMap.set(normalizedEmail, {
      count: 1,
      resetTime: now + 60 * 60 * 1000,
      lockoutUntil: 0,
    });
  } else {
    data.count += 1;
  }
}

export function resetAttempts(request, options = {}) {
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
  const identifier = options.identifier ? `${ip}:${options.identifier}` : ip;
  loginAttemptsMap.delete(identifier);
}

export function resetEmailAttempts(email) {
  if (!email) return;
  emailAttemptsMap.delete(email.toLowerCase().trim());
}
