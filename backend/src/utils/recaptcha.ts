import { env } from '../env';

export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!env.isProduction) {
    return true;
  }

  const params = new URLSearchParams({
    secret: env.RECAPTCHA_SECRET_KEY,
    response: token,
  });

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: params,
  });

  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
