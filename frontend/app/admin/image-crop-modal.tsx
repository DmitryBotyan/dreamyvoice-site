"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import styles from "./styles.module.css";

type Props = {
  imageUrl: string;
  /** Соотношение сторон итогового кадра, например 16 / 9. */
  aspect: number;
  /** Ширина результата в пикселях; высота считается из aspect. */
  outputWidth?: number;
  title?: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

async function cropToBlob(
  imageSrc: string,
  pixelCrop: Area,
  aspect: number,
  outputWidth: number
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.addEventListener("load", () => resolve(element));
    element.addEventListener("error", reject);
    element.src = imageSrc;
  });

  // Не растягиваем картинку вверх: если исходник меньше, берём его размер.
  const width = Math.min(outputWidth, Math.round(pixelCrop.width));
  const height = Math.round(width / aspect);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.92
    );
  });
}

export function ImageCropModal({
  imageUrl,
  aspect,
  outputWidth = 1600,
  title = "Кадрирование",
  onConfirm,
  onCancel,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !applying) {
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [applying, onCancel]);

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) {
      return;
    }
    setApplying(true);
    try {
      onConfirm(await cropToBlob(imageUrl, croppedAreaPixels, aspect, outputWidth));
    } catch {
      setApplying(false);
    }
  }

  return (
    <div className={styles.cropOverlay} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.cropDialog}>
        <p className={styles.cropTitle}>{title}</p>

        <div className={styles.cropArea}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <label className={styles.cropControls}>
          Масштаб
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        <div className={styles.cropActions}>
          <button type="button" onClick={onCancel} disabled={applying}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.cropConfirm}
            onClick={handleConfirm}
            disabled={applying || !croppedAreaPixels}
          >
            {applying ? "Применяем…" : "Применить"}
          </button>
        </div>
      </div>
    </div>
  );
}
