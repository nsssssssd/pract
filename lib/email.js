import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.yandex.ru',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationCode(email, code) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[EMAIL] SMTP credentials not configured');
    throw new Error('SMTP не настроен');
  }

  const info = await transporter.sendMail({
    from: `"TulpanOmsk55" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Код подтверждения регистрации',
    text: `Ваш код подтверждения: ${code}\n\nКод действителен 10 минут.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #c41e3a;">Подтверждение регистрации</h2>
        <p>Ваш код подтверждения:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 16px; background: #f5f0eb; border-radius: 8px; text-align: center; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #6b6560;">Код действителен в течение 10 минут.</p>
        <p style="color: #6b6560; font-size: 12px;">Если вы не запрашивали этот код, просто проигнорируйте письмо.</p>
      </div>
    `,
  });

  console.log('[EMAIL] Sent to', email, '— messageId:', info.messageId);
  return info;
}
