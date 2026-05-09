'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { clientConfig } from '@/lib/client-config';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch(`${clientConfig.apiProxyBasePath}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <>
      {status === 'loading' && <p>Проверяем ссылку…</p>}
      {status === 'success' && (
        <>
          <p>Email успешно подтверждён!</p>
          <Link href="/login">Войти в аккаунт</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <p>Ссылка недействительна или уже использована.</p>
          <Link href="/login">На страницу входа</Link>
        </>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <section>
      <h1>Подтверждение email</h1>
      <Suspense fallback={<p>Загрузка…</p>}>
        <VerifyEmailContent />
      </Suspense>
    </section>
  );
}
