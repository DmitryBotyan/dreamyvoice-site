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
        <h1 className={styles.favoritesTitle}>Избранное</h1>
        <p className={styles.favoritesSubtitle}>
          Войдите, чтобы сохранять тайтлы и возвращаться к ним с любого устройства.
        </p>
      </header>
    </section>
  );
}
