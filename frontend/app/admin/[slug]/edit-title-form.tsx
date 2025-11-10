'use client';

/* eslint-disable @next/next/no-img-element */

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { UpdateTitleFormState } from "./actions";
import { clientConfig } from "@/lib/client-config";
import { buildMediaUrl } from "@/lib/media";
import styles from "../styles.module.css";

const initialState: UpdateTitleFormState = { success: false };

type Props = {
  action: (state: UpdateTitleFormState, formData: FormData) => Promise<UpdateTitleFormState>;
  initialValues: {
    name: string;
    description?: string | null;
    coverKey?: string | null;
    published: boolean;
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Сохраняем..." : "Сохранить"}
    </button>
  );
}

export function EditTitleForm({ action, initialValues }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [coverKey, setCoverKey] = useState(initialValues.coverKey ?? '');
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCoverUploadError('Файл больше 5 МБ');
      return;
    }

    setIsUploadingCover(true);
    setCoverUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${clientConfig.apiProxyBasePath}/media/covers`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    setIsUploadingCover(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setCoverUploadError(payload?.message ?? 'Не удалось загрузить обложку');
      return;
    }

    const data = await response.json();
    setCoverKey(data.key ?? '');
  }

  return (
    <form action={formAction} className={styles.formCard}>
      <fieldset className={styles.adminFieldset}>
        <legend>Основная информация</legend>
        <label>
          Название
          <input
            type="text"
            name="name"
            minLength={3}
            maxLength={128}
            defaultValue={initialValues.name}
            required
          />
        </label>
        <label>
          Описание
          <textarea
            name="description"
            maxLength={5000}
            rows={5}
            defaultValue={initialValues.description ?? ""}
          />
        </label>
        <label>
          Ключ обложки
          <input
            type="text"
            name="coverKey"
            maxLength={255}
            value={coverKey}
            onChange={(event) => setCoverKey(event.target.value)}
          />
        </label>
        <label>
          Загрузить новую обложку
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} />
          {isUploadingCover ? <span className={styles.formHint}>Загрузка...</span> : null}
          {coverUploadError ? (
            <p role="alert" className={`${styles.formStatus} ${styles.formStatusError}`}>
              {coverUploadError}
            </p>
          ) : null}
          {coverKey ? (
            <img
              className={styles.coverPreview}
              src={buildMediaUrl("covers", coverKey)!}
              alt="Текущая обложка"
              width={160}
              height={220}
            />
          ) : null}
        </label>
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="published" defaultChecked={initialValues.published} />
          Опубликован
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
          <p className={`${styles.formStatus} ${styles.formStatusSuccess}`}>Изменения сохранены.</p>
        ) : null}
      </div>
    </form>
  );
}
