"use client";

import { useEffect, useRef } from "react";
import { decode } from "blurhash";

type Props = {
  /** HTML новости — уже очищенный по allow-list на бэкенде. */
  html: string;
  className?: string;
};

const BLUR_WIDTH = 32;

/**
 * Тело новости с размытой заглушкой под картинками: пока файл грузится, на его
 * месте стоит blurhash — тот же приём, что на карточках каталога.
 *
 * Разметка приходит строкой, поэтому картинки оборачиваются уже после
 * монтирования: React в этот кусок дерева больше не заглядывает.
 */
export function NewsBody({ html, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const images = root.querySelectorAll<HTMLImageElement>("img[data-blurhash]");

    images.forEach((image) => {
      const hash = image.dataset.blurhash;
      if (!hash || image.dataset.blurhashReady) {
        return;
      }
      image.dataset.blurhashReady = "1";

      const width = image.getAttribute("width");
      const height = image.getAttribute("height");
      const ratio =
        width && height && Number(width) > 0 ? Number(height) / Number(width) : 9 / 16;

      const canvas = document.createElement("canvas");
      canvas.className = "cover-image-blur";
      canvas.setAttribute("aria-hidden", "true");
      canvas.width = BLUR_WIDTH;
      canvas.height = Math.max(1, Math.round(BLUR_WIDTH * ratio));

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      try {
        const pixels = decode(hash, canvas.width, canvas.height);
        const imageData = context.createImageData(canvas.width, canvas.height);
        imageData.data.set(pixels);
        context.putImageData(imageData, 0, 0);
      } catch {
        // Битый хэш — просто оставляем картинку как есть.
        return;
      }

      const wrapper = document.createElement("span");
      wrapper.className = "news-body-media";
      image.replaceWith(wrapper);
      wrapper.append(image, canvas);

      const reveal = () => {
        image.style.opacity = "1";
        canvas.style.opacity = "0";
      };

      if (image.complete) {
        reveal();
        return;
      }

      image.style.opacity = "0";
      image.addEventListener("load", reveal, { once: true });
      image.addEventListener("error", reveal, { once: true });
    });
  }, [html]);

  return (
    <div
      ref={rootRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
