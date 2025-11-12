import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser, getTitles } from "@/lib/server-api";
import { AuthActions } from "./auth-actions";
import { HeaderSearch } from "./header-search";
import { SiteNav } from "./site-nav";
import { SiteLogo } from "./site-logo";
import { SiteFooter } from "./site-footer";
import { AuthModalProvider } from "./auth-modal-context";
import { ScrollTopOnNavigation } from "./scroll-top";

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
        <ScrollTopOnNavigation />
        <AuthModalProvider>
          <header className="site-header">
            <div className="site-header-left">
              <SiteLogo />
              <HeaderSearch titles={headerSearchOptions} />
            </div>
            <SiteNav isAuthenticated={Boolean(currentUser)} />
            <AuthActions currentUser={currentUser} />
          </header>
          {/* <div className="site-header-placeholder" aria-hidden="true" /> */}
          <main className="site-main">{children}</main>
          <SiteFooter
            titles={headerSearchOptions}
            isAuthenticated={Boolean(currentUser)}
          />
        </AuthModalProvider>
      </body>
    </html>
  );
}
