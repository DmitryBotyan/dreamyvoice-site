"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/types";
import { clientConfig } from "@/lib/client-config";
import { buildMediaUrl } from "@/lib/media";
import { GENRE_KEYWORDS } from "@/lib/genres";
import styles from "./profile.module.css";

type Props = {
  user: PublicUser;
};

export function ProfileForm({ user }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? '');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(user.favoriteGenres ?? []);
  const [avatarPreview, setAvatarPreview] = useState(
    user.avatarKey ? buildMediaUrl("avatars", user.avatarKey) : null,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleGenre(genre: string) {
    setFavoriteGenres((prev) => {
      if (prev.includes(genre)) return prev.filter((g) => g !== genre);
      if (prev.length >= 5) return prev;
      return [...prev, genre];
    });
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Файл слишком большой — выберите изображение до 5 МБ");
      return;
    }

    setAvatarFile(file);
    setError(null);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setStatus(null);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);
    formData.append("favoriteGenres", JSON.stringify(favoriteGenres));
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const response = await fetch(`${clientConfig.apiProxyBasePath}/profile`, {
      method: "PATCH",
      credentials: "include",
      body: formData,
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Профиль не сохранился — данные в полях не потеряны, попробуйте снова");
      return;
    }

    setStatus("Сохранено");
    router.refresh();
  }

  const usernameFieldId = "profile-username";
  const bioFieldId = "profile-bio";
  const avatarFieldId = "profile-avatar";

  return (
    <form onSubmit={handleSubmit} className={styles.profileForm}>
      <div className={styles.fieldGroup}>
        <label htmlFor={usernameFieldId} className={styles.fieldLabel}>
          Никнейм
        </label>
        <input
          id={usernameFieldId}
          className={styles.textInput}
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          minLength={3}
          maxLength={32}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor={bioFieldId} className={styles.fieldLabel}>
          О себе
        </label>
        <textarea
          id={bioFieldId}
          className={styles.textInput}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Расскажите немного о себе..."
        />
        <p className={styles.fieldHint}>{bio.length}/500</p>
      </div>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Любимые жанры</span>
        <div className={styles.genrePickerGrid} role="group" aria-label="Выбор любимых жанров">
          {GENRE_KEYWORDS.map((genre) => {
            const active = favoriteGenres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`${styles.genreChipBtn}${active ? ` ${styles.genreChipBtnActive}` : ''}`}
                aria-pressed={active}
              >
                {genre}
              </button>
            );
          })}
        </div>
        <p className={styles.genrePickerHint}>
          {favoriteGenres.length}/5 выбрано
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor={avatarFieldId} className={styles.fieldLabel}>
          Аватар
        </label>
        <input
          id={avatarFieldId}
          className={styles.fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleAvatarChange}
        />
        <p className={styles.fieldHint}>PNG, JPEG или WEBP, размером до 5 МБ.</p>
      </div>

      <div className={styles.avatarPreview}>
        <p className={styles.fieldLabel}>Предпросмотр</p>
        {avatarPreview ? (
          <img src={avatarPreview} alt="Текущий аватар" className={styles.avatarPreviewImage} width={96} height={96} />
        ) : (
          <p className={styles.avatarPreviewEmpty}>Изображение появится после выбора файла.</p>
        )}
      </div>

      <div className={styles.formActions}>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : "Сохранить"}
        </button>
        {status ? (
          <span className={`${styles.feedback} ${styles.feedbackSuccess}`} role="status" aria-live="polite">
            {status}
          </span>
        ) : null}
        {error ? (
          <span className={`${styles.feedback} ${styles.feedbackError}`} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
