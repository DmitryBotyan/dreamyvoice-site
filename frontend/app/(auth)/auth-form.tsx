'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clientConfig } from '@/lib/client-config';

type Props = {
  mode: 'login' | 'register';
  onSwitchMode?: (mode: 'login' | 'register') => void;
  onSuccess?: () => void;
};

export function AuthForm({ mode, onSwitchMode, onSuccess }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    setRepeatPassword('');
    setError(null);
  }, [mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'register' && password !== repeatPassword) {
      setError('Пароли должны совпадать');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${clientConfig.apiProxyBasePath}/auth/${mode === 'login' ? 'login' : 'register'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? 'Ошибка авторизации');
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
      <button type="submit" disabled={isSubmitting}>
        {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
      </button>
      {error ? <p>{error}</p> : null}
    </form>
  );
}
