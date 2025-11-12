"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buildMediaUrl } from "@/lib/media";
import { clientConfig } from "@/lib/client-config";
import type { PublicUser } from "@/lib/types";
import { useAuthModal } from "./auth-modal-context";

type Props = {
  currentUser: PublicUser | null;
};

export function AuthActions({ currentUser }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openModal } = useAuthModal();
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) {
      return;
    }

    const updateHeaderHeightProperty = () => {
      const headerHeight = header.offsetHeight;
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${headerHeight}px`
      );
    };

    function handleScroll() {
      const isStuck = window.scrollY > 10;
      header.classList.toggle("site-header--stuck", isStuck);
    }

    const handleResize = () => {
      updateHeaderHeightProperty();
    };

    updateHeaderHeightProperty();
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.documentElement.style.removeProperty("--site-header-height");
    };
  }, []);

  if (!currentUser) {
    return (
      <div className="auth-actions">
        <button type="button" onClick={() => openModal("login")}>
          Войти или зарегистрироваться
        </button>
      </div>
    );
  }

  const avatarUrl = currentUser.avatarKey
    ? buildMediaUrl("avatars", currentUser.avatarKey)
    : null;
  const avatarInitial = currentUser.username.charAt(0).toUpperCase();

  async function handleLogout() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${clientConfig.apiProxyBasePath}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось выйти");
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
      <div className="auth-avatar">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${currentUser.username} avatar`}
            width={36}
            height={36}
            priority
          />
        ) : (
          <span>{avatarInitial}</span>
        )}
      </div>
      <span className="auth-greeting">
        Привет, <Link href="/profile">{currentUser.username}</Link>
      </span>
      <button onClick={handleLogout} disabled={isLoading}>
        Выйти
      </button>
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
