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
        <Script
          id="cvh-player"
          src="https://player.cdnvideohub.com/s2/stable/video-player.umd.js"
          strategy="afterInteractive"
        />
        <Script
          id="yandex-metrika"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=105431170', 'ym');
              ym(105431170, 'init', {
                ssr:true,
                webvisor:true,
                clickmap:true,
                ecommerce:"dataLayer",
                accurateTrackBounce:true,
                trackLinks:true
              });
            `,
          }}
        />
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/105431170"
              style={{ position: 'absolute', left: '-9999px' }}
              alt=""
            />
          </div>
        </noscript>
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
