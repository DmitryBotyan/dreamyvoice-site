"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "dv_cookie_notice";

/**
 * Уведомление о cookie: информирование, а не запрос согласия.
 * Если появятся cookie аналитики, которые можно отключить, здесь понадобится
 * настоящий выбор и загрузка счётчика только после согласия.
 */
export function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setIsVisible(true);
      }
    } catch {
      // приватный режим — просто не показываем
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "seen");
    } catch {
      // не критично: уведомление закроется хотя бы на эту сессию
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="cookie-notice" role="region" aria-label="Уведомление о cookie">
      <p className="cookie-notice-text">
        Сайт использует cookie, чтобы вы оставались в аккаунте. Какие именно и
        зачем — в <Link href="/privacy">политике конфиденциальности</Link>.
      </p>
      <button type="button" className="cookie-notice-button" onClick={dismiss}>
        Понятно
      </button>
    </div>
  );
}
