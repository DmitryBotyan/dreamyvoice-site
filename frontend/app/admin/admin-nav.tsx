"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./styles.module.css";

const SECTIONS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/titles", label: "Тайтлы" },
  { href: "/admin/news", label: "Новости" },
  { href: "/admin/comments", label: "Комментарии" },
  { href: "/admin/team", label: "Команда" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebarNav} aria-label="Разделы админки">
      {SECTIONS.map((section) => {
        // «Обзор» активен только на самом /admin, остальные — вместе с вложенными страницами.
        const isActive =
          section.href === "/admin"
            ? pathname === "/admin"
            : pathname === section.href || pathname.startsWith(`${section.href}/`);

        return (
          <Link
            key={section.href}
            href={section.href}
            className={`${styles.sidebarLink}${
              isActive ? ` ${styles.sidebarLinkActive}` : ""
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
