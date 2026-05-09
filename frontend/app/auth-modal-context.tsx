'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthForm } from "./(auth)/auth-form";

type AuthModalMode = 'login' | 'register';

type AuthModalContextValue = {
  activeModal: AuthModalMode | null;
  openModal: (mode: AuthModalMode) => void;
  closeModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<AuthModalMode | null>(null);

  const openModal = useCallback((mode: AuthModalMode) => {
    setActiveModal(mode);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  useEffect(() => {
    if (!activeModal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeModal]);

  useEffect(() => {
    if (!activeModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, closeModal]);

  const contextValue = useMemo(
    () => ({
      activeModal,
      openModal,
      closeModal,
    }),
    [activeModal, openModal, closeModal],
  );

  return (
    <AuthModalContext.Provider value={contextValue}>
      {children}
      {activeModal ? (
        <div className="auth-modal-overlay" onClick={closeModal}>
          <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <div className="auth-modal-header">
              <h2 className="auth-modal-title">
                {activeModal === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
              </h2>
              <button
                type="button"
                className="auth-modal-close"
                aria-label="Закрыть окно"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>
            <AuthForm
              key={activeModal}
              mode={activeModal}
              onSwitchMode={openModal}
              onSuccess={closeModal}
            />
          </div>
        </div>
      ) : null}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal должен вызываться внутри AuthModalProvider');
  }

  return context;
}
