import nodemailer from 'nodemailer';
import { env } from '../env';
import { buildVerificationEmail, buildPasswordResetEmail } from './email-templates';

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

async function send(to: string, subject: string, html: string, text: string, label: string) {
  if (!transport) {
    console.log(`[email:stub] ${label} → ${to}`);
    console.log(`[email:stub] subject: ${subject}`);
    console.log(`[email:stub] text: ${text.replace(/\n/g, ' ⏎ ')}`);
    return;
  }
  try {
    const info = await transport.sendMail({ from: env.SMTP_FROM, to, subject, html, text });
    console.log(`[email] sent ${label} → ${to} (messageId=${info.messageId}, response=${info.response})`);
  } catch (err) {
    console.error(`[email] failed to send ${label} → ${to}:`, err);
    throw err;
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${env.APP_URL}/verify-email?token=${token}`;
  const tpl = buildVerificationEmail({ appUrl: env.APP_URL, link });
  await send(to, tpl.subject, tpl.html, tpl.text, 'VERIFY_EMAIL');
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.APP_URL}/reset-password?token=${token}`;
  const tpl = buildPasswordResetEmail({ appUrl: env.APP_URL, link });
  await send(to, tpl.subject, tpl.html, tpl.text, 'RESET_PASSWORD');
}
