"use client";

import Link from "next/link";
import { type MouseEvent } from "react";
import { useAuthModal } from "./auth-modal-context";

type Props = {
  isAuthenticated: boolean;
};

export function SiteNav({ isAuthenticated }: Props) {
  const { openModal } = useAuthModal();

  const handleFavoritesClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      event.preventDefault();
      openModal("login");
    }
  };

  return (
    <nav className="site-nav">
      <Link href="/#catalog">Каталог</Link>
      <Link href="/titles/random">Рандом</Link>
      <Link href="/favorites" onClick={handleFavoritesClick}>
        Избранное
      </Link>
      <Link href="/team">Команда</Link>
    </nav>
  );
}
