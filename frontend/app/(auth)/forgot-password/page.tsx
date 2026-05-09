'use client';

import { useEffect, useRef, useState } from 'react';
import { clientConfig } from '@/lib/client-config';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
const IS_DEV = process.env.NODE_ENV === 'development';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaRendered = useRef(false);

  useEffect(() => {
    if (IS_DEV) return;
    const scriptId = 'recaptcha-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (IS_DEV || !captchaRef.current || captchaRendered.current) return;

    const interval = setInterval(() => {
      if (window.grecaptcha?.ready && captchaRef.current && !captchaRendered.current) {
        clearInterval(interval);
        window.grecaptcha.ready(() => {
          if (captchaRef.current && !captchaRendered.current) {
            captchaRendered.current = true;
            window.grecaptcha.render(captchaRef.current, { sitekey: SITE_KEY });
          }
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const recaptchaToken = IS_DEV
      ? 'dev-bypass'
      : (() => { try { return window.grecaptcha?.getResponse() ?? ''; } catch { return ''; } })();
    if (!IS_DEV && !recaptchaToken) {
      setError('Подтвердите, что вы не робот');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await fetch(`${clientConfig.apiProxyBasePath}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recaptchaToken }),
      });
      setSubmitted(true);
    } catch {
      setError('Что-то пошло не так. Попробуйте позже.');
      window.grecaptcha?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section>
        <h1>Восстановление пароля</h1>
        <p>
          Если аккаунт с адресом <strong>{email}</strong> существует, мы отправили письмо со ссылкой для сброса пароля.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>Забыли пароль?</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {IS_DEV ? null : <div ref={captchaRef} style={{ margin: '12px 0' }} />}
        <button type="submit" disabled={isSubmitting}>
          Отправить ссылку
        </button>
        {error ? <p>{error}</p> : null}
      </form>
    </section>
  );
}
