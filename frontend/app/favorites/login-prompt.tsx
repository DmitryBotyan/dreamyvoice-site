"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthModal } from "@/app/auth-modal-context";

export function FavoritesLoginPrompt() {
  const { openModal } = useAuthModal();

  useEffect(() => {
    openModal("login");
  }, [openModal]);

  return (
    <section className="favorites-page">
      <header className="favorites-heading">
        <div>
          <p className="favorites-eyebrow">Вход</p>
          <h1 className="favorites-title">Ваши избранные</h1>
        </div>
        <p className="favorites-subtitle">
          Войдите или зарегистрируйтесь, чтобы сохранять тайтлы.
        </p>
      </header>
      <div className="favorites-empty">
        <p>Вы не авторизованы на нашем сайте</p>
      </div>
    </section>
  );
}
