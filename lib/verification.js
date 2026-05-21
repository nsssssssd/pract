import { readData, writeData } from './db.js';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanupExpiredCodes(data) {
  const now = Date.now();
  if (!data.verificationCodes) data.verificationCodes = [];
  data.verificationCodes = data.verificationCodes.filter(
    (c) => c.expiresAt > now
  );
}

export async function createCode({ target, type, meta = {} }) {
  const data = readData();
  cleanupExpiredCodes(data);

  // Remove any existing code for this target
  data.verificationCodes = data.verificationCodes.filter(
    (c) => !(c.target === target && c.type === type)
  );

  const code = generateCode();
  const entry = {
    id: Date.now() + Math.random().toString(36).slice(2),
    target,
    type, // 'email' | 'phone'
    code,
    attempts: 0,
    expiresAt: Date.now() + CODE_TTL_MS,
    createdAt: Date.now(),
    meta,
  };

  data.verificationCodes.push(entry);
  await writeData(data);

  return code;
}

export async function verifyCode({ target, type, inputCode }) {
  const data = readData();
  cleanupExpiredCodes(data);

  const entry = data.verificationCodes.find(
    (c) => c.target === target && c.type === type
  );

  if (!entry) {
    return { success: false, error: 'Код не найден или истёк' };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    // Delete code after max attempts
    data.verificationCodes = data.verificationCodes.filter(
      (c) => c.id !== entry.id
    );
    await writeData(data);
    return { success: false, error: 'Превышено количество попыток. Запросите новый код.' };
  }

  entry.attempts += 1;

  if (entry.code !== inputCode) {
    await writeData(data);
    const remaining = MAX_ATTEMPTS - entry.attempts;
    return {
      success: false,
      error: `Неверный код. Осталось попыток: ${remaining}`,
    };
  }

  // Success — delete code
  data.verificationCodes = data.verificationCodes.filter(
    (c) => c.id !== entry.id
  );
  await writeData(data);

  return { success: true, meta: entry.meta };
}

export function canResendCode(target, type, cooldownMs = 60_000) {
  const data = readData();
  const entry = data.verificationCodes?.find(
    (c) => c.target === target && c.type === type
  );
  if (!entry) return true;
  return Date.now() - entry.createdAt >= cooldownMs;
}
