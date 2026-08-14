"use client";

/* eslint-disable @next/next/no-img-element */

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { clientConfig } from "@/lib/client-config";
import { buildMediaUrl } from "@/lib/media";
import { ImageCropModal } from "../image-crop-modal";
import { FileField } from "../ui/file-field";
import { RichTextEditor } from "./rich-text-editor";
import type { NewsFormState } from "./actions";
import styles from "../styles.module.css";

const initialState: NewsFormState = { success: false };

/** Обложка новости показывается карточкой 16:9 в списке и шапкой на странице. */
const COVER_ASPECT = 16 / 9;

export type NewsFormValues = {
  title: string;
  excerpt: string;
  body: string;
  coverKey: string | null;
  coverBlurHash: string | null;
  published: boolean;
};

type Props = {
  action: (state: NewsFormState, formData: FormData) => Promise<NewsFormState>;
  legend: string;
  submitLabel: string;
  successMessage: string;
  initialValues?: NewsFormValues;
  /** У формы создания поля очищаются после сохранения, у формы правки — нет. */
  clearOnSuccess?: boolean;
};

const EMPTY_VALUES: NewsFormValues = {
  title: "",
  excerpt: "",
  body: "",
  coverKey: null,
  coverBlurHash: null,
  published: false,
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Сохраняем..." : label}
    </button>
  );
}

export function NewsForm({
  action,
  legend,
  submitLabel,
  successMessage,
  initialValues = EMPTY_VALUES,
  clearOnSuccess = false,
}: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [coverKey, setCoverKey] = useState<string | null>(initialValues.coverKey);
  const [coverBlurHash, setCoverBlurHash] = useState<string | null>(
    initialValues.coverBlurHash
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [editorResetSignal, setEditorResetSignal] = useState(0);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!state.success || !clearOnSuccess) {
      return;
    }
    formRef.current?.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCoverKey(null);
    setCoverBlurHash(null);
    setEditorResetSignal((value) => value + 1);
  }, [state.success, clearOnSuccess]);

  useEffect(() => {
    return () => {
      if (cropSrc) {
        URL.revokeObjectURL(cropSrc);
      }
    };
  }, [cropSrc]);

  // Файл сначала уходит в кадрирование, на сервер летит уже готовый кадр 16:9.
  function handleCoverChange(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Файл больше 10 МБ");
      return;
    }

    setUploadError(null);
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCropConfirm(blob: Blob) {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
    setIsUploadingCover(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", blob, "cover.jpg");

    try {
      const response = await fetch(
        `${clientConfig.apiProxyBasePath}/media/covers`,
        { method: "POST", body: formData, credentials: "include" }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setUploadError(payload?.message ?? "Не удалось загрузить обложку");
        return;
      }

      const data = await response.json();
      setCoverKey(data.key);
      setCoverBlurHash(data.blurHash ?? null);
    } catch {
      setUploadError("Не удалось загрузить обложку");
    } finally {
      setIsUploadingCover(false);
    }
  }

  function handleCropCancel() {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`${styles.formCard} ${styles.formWide}`}
    >
      <input type="hidden" name="coverKey" value={coverKey ?? ""} />
      <input type="hidden" name="coverBlurHash" value={coverBlurHash ?? ""} />

      <fieldset className={styles.adminFieldset}>
        <legend>{legend}</legend>

        <label>
          Заголовок
          <input
            name="title"
            type="text"
            minLength={3}
            maxLength={200}
            required
            defaultValue={initialValues.title}
          />
        </label>

        <label>
          Краткое описание
          <textarea
            name="excerpt"
            maxLength={400}
            rows={2}
            defaultValue={initialValues.excerpt}
          />
          <span className={styles.fieldHint}>
            Если пусто — соберётся из текста.
          </span>
        </label>

        <div className={styles.selectorField}>
          <span>Обложка</span>
          <FileField
            onSelect={handleCoverChange}
            disabled={isUploadingCover}
            buttonLabel={isUploadingCover ? "Загружаем…" : "Выбрать файл"}
            hint="Кадрирование 16:9"
          >
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
                width={224}
                height={126}
              />
            ) : null}
          </FileField>
        </div>

        {cropSrc ? (
          <ImageCropModal
            imageUrl={cropSrc}
            aspect={COVER_ASPECT}
            title="Кадрирование обложки"
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
          />
        ) : null}

        <div className={styles.editorField}>
          <span className={styles.editorFieldLabel}>Текст новости</span>
          <RichTextEditor
            name="body"
            initialHtml={initialValues.body}
            resetSignal={editorResetSignal}
          />
        </div>

        <label className={styles.checkboxRow}>
          <input
            name="published"
            type="checkbox"
            defaultChecked={initialValues.published}
          />
          Опубликовать
        </label>
      </fieldset>

      <div className={styles.formFooter}>
        <SubmitButton label={submitLabel} />
        {state.error ? (
          <p role="alert" className={`${styles.formStatus} ${styles.formStatusError}`}>
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className={`${styles.formStatus} ${styles.formStatusSuccess}`}>
            {successMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
