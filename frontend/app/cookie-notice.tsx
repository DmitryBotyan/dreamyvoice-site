"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Версия в ключе: текст изменился по существу (добавилась аналитика),
// поэтому уведомление должно показаться заново даже тем, кто его закрывал.
const STORAGE_KEY = "dv_cookie_notice_v2";

/**
 * Уведомление о cookie: информирование, а не запрос согласия.
 * Если понадобится давать выбор по аналитике, здесь появится второй вариант
 * ответа, а счётчик Метрики должен будет грузиться только после согласия.
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
        Сайт использует cookie: они держат вас в аккаунте и помогают Яндекс
        Метрике считать посещения. Какие именно и зачем — в{" "}
        <Link href="/privacy">политике конфиденциальности</Link>.
      </p>
      <button type="button" className="cookie-notice-button" onClick={dismiss}>
        Понятно
      </button>
    </div>
  );
}
