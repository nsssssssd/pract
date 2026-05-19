const rateLimitMap = new Map();

function cleanup() {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(key);
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
