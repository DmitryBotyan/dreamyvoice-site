import nodemailer from 'nodemailer';
import { env } from '../env';

function createTransport() {
  if (!env.emailConfigured) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST!,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! },
  });
}

const transport = createTransport();

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${env.APP_URL}/verify-email?token=${token}`;

  if (!transport) {
    console.log(`[email:stub] VERIFY EMAIL → ${to}`);
    console.log(`[email:stub] Link: ${link}`);
    return;
  }

  await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'Подтверждение email — DreamyVoice',
    html: `
      <p>Для подтверждения вашего email перейдите по ссылке:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Ссылка действительна 24 часа.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.APP_URL}/reset-password?token=${token}`;

  if (!transport) {
    console.log(`[email:stub] RESET PASSWORD → ${to}`);
    console.log(`[email:stub] Link: ${link}`);
    return;
  }

  await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'Сброс пароля — DreamyVoice',
    html: `
      <p>Для сброса пароля перейдите по ссылке:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Ссылка действительна 1 час. Если вы не запрашивали сброс пароля — проигнорируйте это письмо.</p>
    `,
  });
}
