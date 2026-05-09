'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { clientConfig } from '@/lib/client-config';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'activated' | 'verified' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch(`${clientConfig.apiProxyBasePath}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) { setStatus('error'); return; }
        const payload = await res.json().catch(() => ({}));
        // New flow returns a `user` field — that means the account was just
        // created and we are now logged in.
        setStatus(payload?.user ? 'activated' : 'verified');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  useEffect(() => {
    if (status !== 'activated') return;
    const t = setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 1500);
    return () => clearTimeout(t);
  }, [status, router]);

  return (
    <>
      {status === 'loading' && <p>Проверяем ссылку…</p>}
      {status === 'activated' && (
        <>
          <p>Аккаунт активирован, добро пожаловать в DreamyVoice.</p>
          <p>Сейчас перенаправим на главную…</p>
        </>
      )}
      {status === 'verified' && (
        <>
          <p>Email подтверждён.</p>
          <Link href="/login">Войти в аккаунт</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <p>Ссылка недействительна или уже использована.</p>
          <Link href="/register">Зарегистрироваться заново</Link>
        </>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <section className="auth-page-card">
      <header className="auth-page-header">
        <h1 className="auth-page-title">Подтверждение email</h1>
      </header>
      <Suspense fallback={<p>Загрузка…</p>}>
        <VerifyEmailContent />
      </Suspense>
    </section>
  );
}
