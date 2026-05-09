'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

type Props = {
  mode: 'login' | 'register';
  onSwitchMode?: (mode: 'login' | 'register') => void;
  onSuccess?: () => void;
};

export function AuthForm({ mode, onSwitchMode, onSuccess }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaRendered = useRef(false);

  useEffect(() => {
    setRepeatPassword('');
    setEmail('');
    setError(null);
    setSuccessEmail(null);
  }, [mode]);

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

    const tryRender = () => {
      if (window.grecaptcha && captchaRef.current && !captchaRendered.current) {
        captchaRendered.current = true;
        (window.grecaptcha as any).render(captchaRef.current, { sitekey: SITE_KEY });
      }
    };

    const interval = setInterval(() => {
      if (window.grecaptcha) {
        clearInterval(interval);
        tryRender();
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'register' && password !== repeatPassword) {
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
      const body: Record<string, string> = { username, password, recaptchaToken };
      if (mode === 'register') body.email = email;

      const response = await fetch(
        `${clientConfig.apiProxyBasePath}/auth/${mode === 'login' ? 'login' : 'register'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        window.grecaptcha?.reset();
        throw new Error(payload?.message ?? 'Ошибка авторизации');
      }

      if (mode === 'register') {
        setSuccessEmail(email);
        return;
      }

      onSuccess?.();
      router.push('/');
      router.refresh();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successEmail) {
    return (
      <div className="auth-success">
        <p>Аккаунт создан. Письмо с подтверждением отправлено на <strong>{successEmail}</strong>.</p>
        <p>Проверьте почту и перейдите по ссылке для активации аккаунта.</p>
        <Link href="/login">Войти в аккаунт</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Никнейм
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          minLength={3}
          maxLength={32}
          required
        />
      </label>
      {mode === 'register' ? (
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
      ) : null}
      <label>
        Пароль
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          maxLength={128}
          required
        />
      </label>
      {mode === 'register' ? (
        <label>
          Повторите пароль
          <input
            type="password"
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            minLength={6}
            maxLength={128}
            required
          />
        </label>
      ) : null}
      <p className="auth-alt-action">
        {mode === 'login' ? (
          <>
            Нет аккаунта?{' '}
            {onSwitchMode ? (
              <button
                type="button"
                className="text-link-button"
                onClick={() => onSwitchMode('register')}
              >
                Зарегистрируйтесь
              </button>
            ) : (
              <Link href="/register">Зарегистрируйтесь</Link>
            )}
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            {onSwitchMode ? (
              <button
                type="button"
                className="text-link-button"
                onClick={() => onSwitchMode('login')}
              >
                Войдите
              </button>
            ) : (
              <Link href="/login">Войдите</Link>
            )}
          </>
        )}
      </p>
      {mode === 'login' ? (
        <p className="auth-alt-action">
          <Link href="/forgot-password">Забыли пароль?</Link>
        </p>
      ) : null}
      {IS_DEV ? null : <div ref={captchaRef} style={{ margin: '12px 0' }} />}
      <button type="submit" disabled={isSubmitting}>
        {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
      </button>
      {error ? <p>{error}</p> : null}
    </form>
  );
}
