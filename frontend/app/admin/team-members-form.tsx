"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import { clientConfig } from "@/lib/client-config";
import { buildMediaUrl } from "@/lib/media";
import styles from "./styles.module.css";
import { createTeamMemberAction, type CreateTeamMemberFormState } from "./team-members/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Сохраняем..." : "Добавить участника"}
    </button>
  );
}

const initialState: CreateTeamMemberFormState = { success: false };

export function TeamMembersForm() {
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [state, formAction] = useActionState(createTeamMemberAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setAvatarKey(null);
      setUploadError(null);
    }
  }, [state.success]);

  const avatarPreview = avatarKey ? buildMediaUrl("avatars", avatarKey) : null;

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Файл больше 5 МБ");
      return;
    }

    setIsUploadingAvatar(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${clientConfig.apiProxyBasePath}/media/avatars`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setUploadError(payload?.message ?? "Не удалось загрузить фото");
        return;
      }

      const data = await response.json();
      setAvatarKey(data.key);
    } catch (error) {
      setUploadError("Не удалось загрузить фото");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className={styles.formCard}>
      <input name="avatarKey" type="hidden" value={avatarKey ?? ""} />
      <fieldset className={styles.adminFieldset}>
        <legend>Новый участник команды</legend>
        <label>
          Имя
          <input name="name" type="text" minLength={2} maxLength={128} required />
        </label>
        <label>
          Роль
          <input name="role" type="text" minLength={2} maxLength={128} required />
        </label>
        <label>
          Фото
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleAvatarChange}
          />
          {isUploadingAvatar ? (
            <span className={styles.formHint}>Загрузка фото...</span>
          ) : null}
          {uploadError ? (
            <p role="alert" className={`${styles.formStatus} ${styles.formStatusError}`}>
              {uploadError}
            </p>
          ) : null}
          {avatarPreview ? (
            <img
              className={styles.avatarPreview}
              src={avatarPreview}
              alt="Предпросмотр фото участника"
              width={120}
              height={120}
            />
          ) : null}
        </label>
      </fieldset>
      <div className={styles.formFooter}>
        <SubmitButton />
        {state.success ? (
          <p role="status" className={`${styles.formStatus} ${styles.formStatusSuccess}`}>
            Участник добавлен
          </p>
        ) : null}
        {state.error ? (
          <p role="alert" className={`${styles.formStatus} ${styles.formStatusError}`}>
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
