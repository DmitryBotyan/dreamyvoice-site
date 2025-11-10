'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clientConfig } from '@/lib/client-config';
import type { PublicUser } from '@/lib/types';
import { AuthForm } from './(auth)/auth-form';

type Props = {
  currentUser: PublicUser | null;
};

export function AuthActions({ currentUser }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'login' | 'register' | null>(null);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.site-header');
    const placeholder = document.querySelector<HTMLElement>('.site-header-placeholder');

    if (!header || !placeholder) {
      return;
    }

    function syncPlaceholderHeight(isStuck: boolean) {
      placeholder.style.height = isStuck ? `${header.offsetHeight}px` : '0px';
    }

    function handleScroll() {
      const isStuck = window.scrollY > 16;
      header.classList.toggle('site-header--stuck', isStuck);
      syncPlaceholderHeight(isStuck);
    }

    const handleResize = () => {
      if (header.classList.contains('site-header--stuck')) {
        placeholder.style.height = `${header.offsetHeight}px`;
      } else {
        placeholder.style.height = '0px';
      }
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!currentUser) {
    return (
      <>
        <div className="auth-actions">
          <button type="button" onClick={() => setActiveModal('login')}>
            Войти или зарегистрироваться
          </button>
        </div>
        {activeModal ? (
          <div className="auth-modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
              <div className="auth-modal-header">
                <h2 className="auth-modal-title">
                  {activeModal === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
                </h2>
                <button
                  type="button"
                  className="auth-modal-close"
                  aria-label="Закрыть окно"
                  onClick={() => setActiveModal(null)}
                >
                  ✕
                </button>
              </div>
              <AuthForm
                key={activeModal}
                mode={activeModal}
                onSwitchMode={(mode) => setActiveModal(mode)}
              />
            </div>
          </div>
        ) : null}
      </>
    );
  }

  async function handleLogout() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${clientConfig.apiProxyBasePath}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Не удалось выйти');
      }

      router.refresh();
    } catch (logoutError) {
      setError((logoutError as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-actions">
      <span>
        Привет, <Link href="/profile">{currentUser.username}</Link>
      </span>
      <button onClick={handleLogout} disabled={isLoading}>
        Выйти
      </button>
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
