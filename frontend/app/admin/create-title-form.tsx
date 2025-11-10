"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTitleAction, type CreateTitleFormState } from "./actions";
import { clientConfig } from "@/lib/client-config";
import { buildMediaUrl } from "@/lib/media";

import styles from "./styles.module.css";

const initialState: CreateTitleFormState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Сохраняем..." : "Добавить тайтл"}
    </button>
  );
}

export function CreateTitleForm() {
  const [state, formAction] = useActionState(createTitleAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoverKey(null);
    }
  }, [state.success]);

  async function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Файл больше 5 МБ");
      return;
    }

    setIsUploadingCover(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${clientConfig.apiProxyBasePath}/media/covers`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    setIsUploadingCover(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setUploadError(payload?.message ?? "Не удалось загрузить обложку");
      return;
    }

    const data = await response.json();
    setCoverKey(data.key);
  }

  return (
    <form ref={formRef} action={formAction} className={styles.formCard}>
      <input type="hidden" name="coverKey" value={coverKey ?? ""} />
      <fieldset className={styles.adminFieldset}>
        <legend>Новый тайтл</legend>
        <label>
          Название
          <input
            name="name"
            type="text"
            minLength={3}
            maxLength={128}
            required
          />
        </label>
        <label>
          Slug (латиница, цифры, дефис)
          <input
            name="slug"
            type="text"
            minLength={3}
            maxLength={64}
            required
          />
        </label>
        <label>
          Описание
          <textarea name="description" maxLength={5000} rows={4} />
        </label>
        <label>
          Обложка
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleCoverChange}
          />
          {isUploadingCover ? <span className={styles.formHint}>Загрузка...</span> : null}
          {uploadError ? (
            <p role="alert" className={`${styles.formStatus} ${styles.formStatusError}`}>
              {uploadError}
            </p>
          ) : null}
          {coverKey ? (
            <img
              className={styles.coverPreview}
              src={buildMediaUrl("covers", coverKey)!}
              alt="Предпросмотр обложки"
              width={120}
              height={160}
            />
          ) : null}
        </label>
        <label className={styles.checkboxRow}>
          <input name="published" type="checkbox" />
          Опубликован сразу
        </label>
      </fieldset>
      <div className={styles.formFooter}>
        <SubmitButton />
        {state.error ? (
          <p role="alert" className={`${styles.formStatus} ${styles.formStatusError}`}>
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className={`${styles.formStatus} ${styles.formStatusSuccess}`}>Тайтл создан.</p>
        ) : null}
      </div>
    </form>
  );
}
