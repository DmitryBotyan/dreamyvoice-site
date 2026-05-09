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

async function send(to: string, subject: string, html: string, label: string) {
  if (!transport) {
    console.log(`[email:stub] ${label} → ${to}`);
    console.log(`[email:stub] HTML: ${html.replace(/\s+/g, ' ').trim()}`);
    return;
  }
  try {
    const info = await transport.sendMail({ from: env.SMTP_FROM, to, subject, html });
    console.log(`[email] sent ${label} → ${to} (messageId=${info.messageId}, response=${info.response})`);
  } catch (err) {
    console.error(`[email] failed to send ${label} → ${to}:`, err);
    throw err;
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${env.APP_URL}/verify-email?token=${token}`;
  const html = `
    <p>Для подтверждения вашего email перейдите по ссылке:</p>
    <p><a href="${link}">${link}</a></p>
    <p>Ссылка действительна 24 часа.</p>
  `;
  await send(to, 'Подтверждение email — DreamyVoice', html, 'VERIFY_EMAIL');
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.APP_URL}/reset-password?token=${token}`;
  const html = `
    <p>Для сброса пароля перейдите по ссылке:</p>
    <p><a href="${link}">${link}</a></p>
    <p>Ссылка действительна 1 час. Если вы не запрашивали сброс пароля — проигнорируйте это письмо.</p>
  `;
  await send(to, 'Сброс пароля — DreamyVoice', html, 'RESET_PASSWORD');
}
