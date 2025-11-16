import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { getCurrentUser, getTitles } from "@/lib/server-api";
import { AuthActions } from "./auth-actions";
import { HeaderSearch } from "./header-search";
import { SiteNav } from "./site-nav";
import { SiteLogo } from "./site-logo";
import { SiteFooter } from "./site-footer";
import { AuthModalProvider } from "./auth-modal-context";
import { ScrollTopOnNavigation } from "./scroll-top";
import {
  createBaseMetadata,
  createOrganizationJsonLd,
  createWebsiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = createBaseMetadata();

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

  const organizationJsonLd = createOrganizationJsonLd();
  const websiteJsonLd = createWebsiteJsonLd();

  return (
    <html lang="ru">
      <body className="app-body">
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <Script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <ScrollTopOnNavigation />
        <AuthModalProvider>
          <header className="site-header">
            <div className="site-header-left">
              <SiteLogo />
              <HeaderSearch titles={headerSearchOptions} />
            </div>
            <SiteNav
              currentUser={currentUser}
              isAuthenticated={Boolean(currentUser)}
              searchOptions={headerSearchOptions}
            />
            <AuthActions currentUser={currentUser} />
          </header>
          {/* <div className="site-header-placeholder" aria-hidden="true" /> */}
          <main className="site-main">
            <div className="site-main-inner">{children}</div>
          </main>
          <SiteFooter
            titles={headerSearchOptions}
            isAuthenticated={Boolean(currentUser)}
          />
        </AuthModalProvider>
      </body>
    </html>
  );
}
