"use client";

import { useEffect } from "react";
import { useAuthModal } from "@/app/auth-modal-context";
import styles from "./page.module.css";

export function FavoritesLoginPrompt() {
  const { openModal } = useAuthModal();

  useEffect(() => {
    openModal("login");
  }, [openModal]);

  return (
    <section className={styles.favoritesPage}>
      <header className={styles.favoritesHeading}>
        <div>
          <p className={styles.favoritesEyebrow}>Вход</p>
          <h1 className={styles.favoritesTitle}>Ваши избранные</h1>
        </div>
        <p className={styles.favoritesSubtitle}>
          Войдите или зарегистрируйтесь, чтобы сохранять тайтлы.
        </p>
      </header>
      <div className={styles.favoritesEmpty}>
        <p>Вы не авторизованы на нашем сайте</p>
      </div>
    </section>
  );
}
