'use client';

import { useState } from 'react';
import { clientConfig } from '@/lib/client-config';

export function ResendVerification() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleClick() {
    setStatus('sending');
    try {
      const res = await fetch(`${clientConfig.apiProxyBasePath}/auth/resend-verification`, {
        method: 'POST',
        credentials: 'include',
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="email-verify-panel">
      <p>Email не подтверждён. Письмо было отправлено при регистрации.</p>
      {status === 'idle' && (
        <button type="button" onClick={handleClick}>
          Отправить повторно
        </button>
      )}
      {status === 'sending' && <p>Отправляем…</p>}
      {status === 'sent' && <p>Письмо отправлено — проверьте почту.</p>}
      {status === 'error' && (
        <>
          <p>Письмо не отправилось — попробуйте ещё раз.</p>
          <button type="button" onClick={handleClick}>
            Попробовать снова
          </button>
        </>
      )}
    </div>
  );
}
