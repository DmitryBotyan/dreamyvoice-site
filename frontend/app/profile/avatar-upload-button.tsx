'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { clientConfig } from '@/lib/client-config';
import { CropModal } from './crop-modal';
import styles from './profile.module.css';

type Props = {
  avatarUrl: string | null;
  fallbackLetter: string;
};

export function AvatarUploadButton({ avatarUrl, fallbackLetter }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke cropSrc blob URL on unmount to avoid leaks
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // reset so same file can be re-selected after cancel
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой — выберите изображение до 10 МБ');
      return;
    }

    setError(null);
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCropConfirm(blob: Blob) {
    // Revoke the crop source URL before discarding it
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.jpg');

    try {
      const response = await fetch(`${clientConfig.apiProxyBasePath}/profile`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message ?? 'Не удалось загрузить аватар');
        return;
      }

      // Optimistic preview: show cropped blob immediately, router.refresh will
      // eventually replace it with the server URL but state persists across soft nav
      setPreview(URL.createObjectURL(blob));
      router.refresh();
    } catch {
      setError('Не удалось загрузить аватар — проверьте соединение');
    } finally {
      setUploading(false);
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  return (
    <>
      <div className={styles.avatarUploadWrapper}>
        <button
          type="button"
          className={styles.avatarUploadButton}
          onClick={handleClick}
          aria-label="Загрузить аватар"
          disabled={uploading}
        >
          {preview ? (
            <img
              src={preview}
              alt="Текущий аватар"
              width={108}
              height={108}
              className={styles.profileAvatar}
            />
          ) : (
            <span className={styles.profileAvatarFallback}>{fallbackLetter}</span>
          )}
          <span className={styles.avatarOverlay} aria-hidden="true">
            {uploading ? (
              <span className={styles.avatarOverlaySpinner} />
            ) : (
              <Camera size={24} strokeWidth={1.8} />
            )}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className={styles.avatarHiddenInput}
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
        {error && (
          <p className={styles.avatarUploadError} role="alert">
            {error}
          </p>
        )}
      </div>

      {cropSrc && (
        <CropModal
          imageUrl={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
