import Link from "next/link";
import { HeaderSearch } from "./header-search";
import { SiteNav } from "./site-nav";

import { AdminLink } from "./admin-link";

type SiteFooterProps = {
  titles: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  isAuthenticated: boolean;
};

export function SiteFooter({ titles, isAuthenticated }: SiteFooterProps) {
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
          <div className="site-footer-cta-links">
            <a
              href="https://t.me/DreamyVoice_Official"
              aria-label="Telegram"
              target="_blank"
              rel="noreferrer"
              className="site-footer-icon site-footer-icon--telegram"
            >
              <svg
                viewBox="0 0 24 24"
                role="presentation"
                aria-hidden="true"
                className="site-footer-icon-graphic"
              >
                <path
                  d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
                />
              </svg>
              <span className="sr-only">Telegram</span>
            </a>
            <a
              href="https://vk.com/dreamyvoice"
              aria-label="ВКонтакте"
              target="_blank"
              rel="noreferrer"
              className="site-footer-icon site-footer-icon--vk"
            >
              <svg
                viewBox="0 0 24 24"
                role="presentation"
                aria-hidden="true"
                className="site-footer-icon-graphic"
              >
                <path
                  d="m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z"
                />
              </svg>
              <span className="sr-only">ВКонтакте</span>
            </a>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {currentYear} DreamyVoice</span>

        <div className="site-footer-bottom-links">
          <Link href="/support">Поддержать проект</Link>
          <AdminLink isAuthenticated={isAuthenticated} />
          <a href="#catalog">К каталогу ↑</a>
        </div>
      </div>
    </footer>
  );
}
