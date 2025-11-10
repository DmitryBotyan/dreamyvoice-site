import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser, getTitles } from "@/lib/server-api";
import { AuthActions } from "./auth-actions";
import { HeaderSearch } from "./header-search";
import { SiteNav } from "./site-nav";
import Link from "next/link";
import { SiteFooter } from "./site-footer";

export const metadata: Metadata = {
  title: "DreamyVoice",
  description: "Self-hosted каталог релизов команды DreamyVoice",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const titles = await getTitles();
  const headerSearchOptions = titles.map((title) => ({
    id: title.id,
    name: title.name,
    slug: title.slug,
  }));

  return (
    <html lang="ru">
      <body className="app-body">
        <header className="site-header">
          <div className="site-header-left">
            <Link href="/" className="site-logo">
              DreamyVoice
            </Link>
            <HeaderSearch titles={headerSearchOptions} />
          </div>
          <SiteNav />
          <AuthActions currentUser={currentUser} />
        </header>
        <div className="site-header-placeholder" aria-hidden="true" />
        <main className="site-main">{children}</main>
        <SiteFooter titles={headerSearchOptions} />
      </body>
    </html>
  );
}
