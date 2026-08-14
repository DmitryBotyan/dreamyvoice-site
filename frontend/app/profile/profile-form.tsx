"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/types";
import { clientConfig } from "@/lib/client-config";
import styles from "./profile.module.css";

type Props = {
  user: PublicUser;
};

export function ProfileForm({ user }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setStatus(null);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);

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
