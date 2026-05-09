'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { clientConfig } from '@/lib/client-config';

declare global {
  interface Window {
    grecaptcha: {
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
const IS_DEV = process.env.NODE_ENV === 'development';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [success, setSuccess] = useState(false);
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
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (IS_DEV || !captchaRef.current || captchaRendered.current) return;

    const interval = setInterval(() => {
      if (window.grecaptcha && captchaRef.current && !captchaRendered.current) {
        clearInterval(interval);
        captchaRendered.current = true;
        (window.grecaptcha as any).render(captchaRef.current, { sitekey: SITE_KEY });
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  if (!token) {
    return (
      <>
        <p>Ссылка недействительна.</p>
        <Link href="/forgot-password">Запросить новую ссылку</Link>
      </>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== repeatPassword) {
      setError('Пароли должны совпадать');
      return;
    }

    const recaptchaToken = IS_DEV ? 'dev-bypass' : (window.grecaptcha?.getResponse() ?? '');
    if (!IS_DEV && !recaptchaToken) {
      setError('Подтвердите, что вы не робот');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${clientConfig.apiProxyBasePath}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        window.grecaptcha?.reset();
        throw new Error(payload?.message ?? 'Ошибка сброса пароля');
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <>
        <p>Пароль успешно обновлён.</p>
        <Link href="/login">Войти в аккаунт</Link>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Новый пароль
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          maxLength={128}
          required
        />
      </label>
      <label>
        Повторите пароль
        <input
          type="password"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          minLength={6}
          maxLength={128}
          required
        />
      </label>
      {IS_DEV ? null : <div ref={captchaRef} style={{ margin: '12px 0' }} />}
      <button type="submit" disabled={isSubmitting}>
        Сохранить пароль
      </button>
      {error ? <p>{error}</p> : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <section>
      <h1>Новый пароль</h1>
      <Suspense fallback={<p>Загрузка…</p>}>
        <ResetPasswordContent />
      </Suspense>
    </section>
  );
}
