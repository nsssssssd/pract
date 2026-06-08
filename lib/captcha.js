/**
 * Simple math CAPTCHA - works without external services
 */

const captchaStore = new Map();

function cleanup() {
  const now = Date.now();
  for (const [key, data] of captchaStore.entries()) {
    if (now > data.expiresAt) {
      captchaStore.delete(key);
    }
  }
}

export function generateCaptcha() {
  cleanup();
  
  const operations = [
    { sign: '+', fn: (a, b) => a + b },
    { sign: '-', fn: (a, b) => a - b },
    { sign: '*', fn: (a, b) => a * b },
  ];
  
  const op = operations[Math.floor(Math.random() * operations.length)];
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  
  // Ensure positive result for subtraction
  const [num1, num2] = op.sign === '-' && a < b ? [b, a] : [a, b];
  
  const answer = op.fn(num1, num2);
  const id = Math.random().toString(36).substring(2, 15);
  
  captchaStore.set(id, {
    answer: String(answer),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    id,
    question: `${num1} ${op.sign} ${num2} = ?`,
  };
}

export function verifyCaptcha(id, userAnswer) {
  cleanup();
  
  if (!id || !userAnswer) {
    return { success: false, error: 'Введите ответ' };
  }
  
  const data = captchaStore.get(id);
  if (!data) {
    return { success: false, error: 'CAPTCHA устарела, обновите страницу' };
  }
  
  if (Date.now() > data.expiresAt) {
    captchaStore.delete(id);
    return { success: false, error: 'CAPTCHA устарела, обновите страницу' };
  }
  
  if (String(userAnswer).trim() !== data.answer) {
    return { success: false, error: 'Неверный ответ' };
  }
  
  captchaStore.delete(id);
  return { success: true };
}
