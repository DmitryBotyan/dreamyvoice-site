"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { clientConfig } from "@/lib/client-config";
import type { PublicUser } from "@/lib/types";
import { useAuthModal } from "./auth-modal-context";
import { HeaderSearch } from "./header-search";

type NavItem = {
  key: string;
  href: string;
  label: string;
  onClick?: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
};

type Props = {
  isAuthenticated?: boolean;
  variant?: "header" | "footer";
  searchOptions?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  currentUser?: PublicUser | null;
};

export function SiteNav({
  isAuthenticated,
  variant = "header",
  searchOptions,
  currentUser = null,
}: Props) {
  const router = useRouter();
  const { openModal } = useAuthModal();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const isHeaderNav = variant === "header";
  const isUserAuthenticated =
    typeof isAuthenticated === "boolean"
      ? isAuthenticated
      : Boolean(currentUser);
  const navClassName = ["site-nav", `site-nav--${variant}`]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!isHeaderNav) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHeaderNav]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (mobileMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      const trigger = (event.target as HTMLElement).closest(
        ".site-nav-mobile-trigger",
      );

      if (!trigger) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleFavoritesClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!isUserAuthenticated) {
      event.preventDefault();
      openModal("login");
    }
  };

  const navItems: NavItem[] = [
    {
      key: "random",
      href: "/titles/random",
      label: "Рандом",
    },
    {
      key: "favorites",
      href: "/favorites",
      label: "Избранное",
      onClick: handleFavoritesClick,
    },
    {
      key: "team",
      href: "/team",
      label: "Команда",
    },
  ];

  const renderExtraNavLinks = (options?: {
    closeDropdown?: boolean;
    closeMobile?: boolean;
  }) =>
    navItems.map((item) => (
      <Link
        key={`${options?.closeDropdown ? "dropdown" : "inline"}-${item.key}`}
        href={item.href}
        onClick={(event) => {
          item.onClick?.(event);
          if (options?.closeDropdown) {
            setIsMoreOpen(false);
          }
          if (options?.closeMobile) {
            closeMobileMenu();
          }
        }}
      >
        {item.label}
      </Link>
    ));

  const renderCatalogLink = (options?: { closeMobile?: boolean }) => (
    <Link
      href="/#catalog"
      onClick={() => {
        if (options?.closeMobile) {
          closeMobileMenu();
        }
      }}
    >
      Каталог
    </Link>
  );

  const mobileMenuId = "site-nav-mobile-panel";

  const handleMobileLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch(
        `${clientConfig.apiProxyBasePath}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Не удалось выйти");
      }

      closeMobileMenu();
      router.refresh();
    } catch (error) {
      setLogoutError((error as Error).message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className={navClassName}>
      <div className="site-nav-links">
        {renderCatalogLink()}
        {isHeaderNav ? (
          <>
            <div className="site-nav-extra">{renderExtraNavLinks()}</div>
            <div
              className={`site-nav-more${
                isMoreOpen ? " site-nav-more--open" : ""
              }`}
              ref={moreRef}
            >
              <button
                type="button"
                className="site-nav-more-trigger"
                aria-haspopup="true"
                aria-expanded={isMoreOpen}
                aria-controls="site-nav-more-panel"
                onClick={() => setIsMoreOpen((prev) => !prev)}
              >
                Еще
              </button>
              <div
                id="site-nav-more-panel"
                className="site-nav-more-panel"
                role="menu"
              >
                {renderExtraNavLinks({ closeDropdown: true })}
              </div>
            </div>
          </>
        ) : (
          renderExtraNavLinks()
        )}
      </div>
      {isHeaderNav && (
        <>
          <button
            type="button"
            className={`site-nav-mobile-trigger${
              isMobileMenuOpen ? " site-nav-mobile-trigger--open" : ""
            }`}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            <span className="site-nav-mobile-trigger-bar" aria-hidden="true" />
            <span className="site-nav-mobile-trigger-bar" aria-hidden="true" />
            <span className="site-nav-mobile-trigger-bar" aria-hidden="true" />
          </button>
          <div
            className={`site-nav-mobile${
              isMobileMenuOpen ? " site-nav-mobile--open" : ""
            }`}
          >
            <div
              className="site-nav-mobile-backdrop"
              role="presentation"
              onClick={closeMobileMenu}
            />
            <div
              id={mobileMenuId}
              className="site-nav-mobile-panel"
              ref={mobileMenuRef}
              role="dialog"
              aria-modal={isMobileMenuOpen ? "true" : undefined}
              aria-label="Навигация по сайту"
            >
              <div className="site-nav-mobile-header">
                <span>Меню</span>
                <button
                  type="button"
                  className="site-nav-mobile-close"
                  onClick={closeMobileMenu}
                  aria-label="Закрыть меню"
                >
                  <span aria-hidden="true" />
                </button>
              </div>
              {searchOptions ? (
                <div className="site-nav-mobile-search">
                  <HeaderSearch titles={searchOptions} />
                </div>
              ) : null}
              <div className="site-nav-mobile-links">
                {renderCatalogLink({ closeMobile: true })}
                {renderExtraNavLinks({ closeMobile: true })}
              </div>
              <div className="site-nav-mobile-auth">
                {isUserAuthenticated && currentUser ? (
                  <>
                    <p className="site-nav-mobile-auth-greeting">
                      Привет,{" "}
                      <Link
                        href="/profile"
                        onClick={() => {
                          closeMobileMenu();
                        }}
                      >
                        {currentUser.username}
                      </Link>
                    </p>
                    <button
                      type="button"
                      className="site-nav-mobile-auth-logout"
                      onClick={handleMobileLogout}
                      disabled={isLoggingOut}
                    >
                      Выйти
                    </button>
                    {logoutError ? (
                      <p className="site-nav-mobile-auth-error">
                        {logoutError}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <button
                    type="button"
                    className="site-nav-mobile-auth-login"
                    onClick={() => {
                      openModal("login");
                      closeMobileMenu();
                    }}
                  >
                    Войти или зарегистрироваться
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
