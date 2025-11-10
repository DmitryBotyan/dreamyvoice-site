'use client';

import Link from "next/link";
import type { MouseEvent } from "react";
import { useAuthModal } from "./auth-modal-context";

type AdminLinkProps = {
  isAuthenticated: boolean;
  className?: string;
};

export function AdminLink({ isAuthenticated, className }: AdminLinkProps) {
  const { openModal } = useAuthModal();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isAuthenticated) {
      event.preventDefault();
      openModal('login');
    }
  }

  return (
    <Link href="/admin" className={className} onClick={handleClick}>
      Админ-панель
    </Link>
  );
}
