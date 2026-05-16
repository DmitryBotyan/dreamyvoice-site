"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { clientConfig } from "@/lib/client-config";
import styles from "./profile.module.css";

type Props = {
  avatarUrl: string | null;
  fallbackLetter: string;
};

export function AvatarUploadButton({ avatarUrl, fallbackLetter }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Файл слишком большой — выберите изображение до 5 МБ");
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${clientConfig.apiProxyBasePath}/profile`, {
      method: "PATCH",
      credentials: "include",
      body: formData,
    });

    setUploading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Не удалось загрузить аватар");
      return;
    }

    router.refresh();
  }

  return (
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
        onChange={handleChange}
        tabIndex={-1}
        aria-hidden="true"
      />
      {error && (
        <p className={styles.avatarUploadError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
