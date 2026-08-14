/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import { AdminNav } from "./admin-nav";
import { AdminSearch } from "./admin-search";
import styles from "./styles.module.css";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/admin");
  }

  if (currentUser.role !== "ADMIN") {
    return (
      <section className={styles.accessDenied}>
        <h1>Требуются права администратора</h1>
        <p>
          Вы вошли как {currentUser.username}, но ваша роль не позволяет работать
          с админкой.
        </p>
        <p>
          Вернуться к <Link href="/">каталогу</Link>.
        </p>
      </section>
    );
  }

  const avatarUrl = currentUser.avatarKey
    ? buildMediaUrl("avatars", currentUser.avatarKey)
    : null;

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <Link href="/profile" className={styles.sidebarHeader}>
          <span className={styles.sidebarAvatar} aria-hidden="true">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" width={36} height={36} />
            ) : (
              currentUser.username.charAt(0).toUpperCase()
            )}
          </span>
          <span className={styles.sidebarIdentity}>
            <span className={styles.sidebarTitle}>{currentUser.username}</span>
            <span className={styles.sidebarUser}>Администратор</span>
          </span>
        </Link>

        <AdminSearch />
        <AdminNav />

        <Link href="/" className={styles.sidebarBack}>
          <span>На сайт</span>
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 16 16 8" />
            <path d="M9.5 8H16v6.5" />
          </svg>
        </Link>
      </aside>
      <main className={styles.adminContent}>{children}</main>
    </div>
  );
}
