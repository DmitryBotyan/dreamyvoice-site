import Link from "next/link";
import { HeaderSearch } from "./header-search";
import { SiteNav } from "./site-nav";

type SiteFooterProps = {
  titles: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

export function SiteFooter({ titles }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div className="site-footer-brand">
          <Link href="/" className="site-logo site-footer-logo">
            DreamyVoice
          </Link>
          <p>
            Каталог озвучки DreamyVoice: все релизы, серии и обсуждения в одном
            месте.
          </p>
        </div>

        <div className="site-footer-search">
          <h2>Поиск</h2>
          <HeaderSearch titles={titles} />
        </div>

        <div className="site-footer-nav">
          <h2>Навигация</h2>
          <SiteNav />
        </div>

        <div className="site-footer-cta">
          <h2>Связаться с нами</h2>
          <p>Хотите оставить отзыв или предложить сотрудничество? Напишите команде напрямую.</p>
          <strong className="site-footer-cta-email">example@example.com</strong>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {currentYear} DreamyVoice</span>

        <div className="site-footer-bottom-links">
          <Link href="/support">Поддержать проект</Link>
          <Link href="/admin">Админ-панель</Link>
          <a href="#catalog">К каталогу ↑</a>
        </div>
      </div>
    </footer>
  );
}
