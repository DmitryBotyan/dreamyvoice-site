'use client';

import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import styles from './profile.module.css';

type Props = {
  imageUrl: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

async function cropImageToBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.src = imageSrc;
  });

  const size = Math.min(pixelCrop.width, pixelCrop.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))), 'image/jpeg', 0.92);
  });
}

export function CropModal({ imageUrl, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await cropImageToBlob(imageUrl, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className={styles.cropOverlay} role="dialog" aria-modal="true" aria-label="Кадрирование аватара">
      <div className={styles.cropModal}>
        <p className={styles.cropTitle}>Кадрирование</p>
        <div className={styles.cropArea}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className={styles.cropZoomRow}>
          <span className={styles.cropZoomLabel}>Масштаб</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.cropZoomSlider}
            aria-label="Масштаб"
          />
        </div>
        <div className={styles.cropActions}>
          <button type="button" onClick={onCancel} className={styles.cropCancelBtn} disabled={applying}>
            Отмена
          </button>
          <button type="button" onClick={handleConfirm} disabled={applying}>
            {applying ? 'Применяем...' : 'Применить'}
          </button>
        </div>
      </div>
    </div>
  );
}
