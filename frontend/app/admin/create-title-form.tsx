"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTitleAction, type CreateTitleFormState } from "./actions";
import { clientConfig } from "@/lib/client-config";
import { buildMediaUrl } from "@/lib/media";
import { AGE_RATINGS } from "@/lib/catalog-keywords";
import { GENRE_KEYWORDS } from "@/lib/genres";
import { TAG_KEYWORDS } from "@/lib/catalog-keywords";
import {
  DEFAULT_TITLE_STATUS,
  TITLE_STATUS_OPTIONS,
  type TitleStatus,
} from "@/lib/title-status";
import { Select } from "./ui/select";
import { FileField } from "./ui/file-field";

import styles from "./styles.module.css";

const initialState: CreateTitleFormState = { success: false };

const genreOptions = GENRE_KEYWORDS.map((genre) => ({ value: genre, label: genre }));
const tagOptions = TAG_KEYWORDS.map((tag) => ({ value: tag, label: tag }));
const ageRatingOptions = [
  { value: "", label: "Не указан" },
  ...AGE_RATINGS.map((rating) => ({ value: rating, label: rating })),
];

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
  const [coverBlurHash, setCoverBlurHash] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>(
    genreOptions[0]?.value ?? ""
  );
  const [selectedTag, setSelectedTag] = useState<string>(tagOptions[0]?.value ?? "");
  const [addedGenres, setAddedGenres] = useState<string[]>([]);
  const [addedTags, setAddedTags] = useState<string[]>([]);
  const [titleStatus, setTitleStatus] = useState<TitleStatus>(DEFAULT_TITLE_STATUS);
  const [ageRating, setAgeRating] = useState("");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoverKey(null);
      setCoverBlurHash(null);
      setAddedGenres([]);
      setAddedTags([]);
      setTitleStatus(DEFAULT_TITLE_STATUS);
      setAgeRating("");
    }
  }, [state.success]);

  const handleAddGenre = () => {
    if (!selectedGenre || addedGenres.includes(selectedGenre)) {
      return;
    }
    setAddedGenres((prev) => [...prev, selectedGenre]);
  };

  const handleAddTag = () => {
    if (!selectedTag || addedTags.includes(selectedTag)) {
      return;
    }
    setAddedTags((prev) => [...prev, selectedTag]);
  };

  async function handleCoverSelect(file: File) {
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
    setCoverBlurHash(data.blurHash ?? null);
  }

  return (
    <form ref={formRef} action={formAction} className={styles.formCard}>
      <input type="hidden" name="coverKey" value={coverKey ?? ""} />
      <input type="hidden" name="coverBlurHash" value={coverBlurHash ?? ""} />
      <input type="hidden" name="titleStatus" value={titleStatus} />
      <input type="hidden" name="ageRating" value={ageRating} />

      <fieldset className={styles.adminFieldset}>
        <legend>Новый тайтл</legend>

        <label>
          Название
          <input name="name" type="text" minLength={3} maxLength={255} required />
        </label>

        <label>
          Описание
          <textarea name="description" maxLength={5000} rows={4} />
        </label>

        <div className={styles.fieldRow}>
          <div className={styles.selectorField}>
            <span>Статус</span>
            <Select
              options={TITLE_STATUS_OPTIONS}
              value={titleStatus}
              onChange={(value) => setTitleStatus(value as TitleStatus)}
              ariaLabel="Статус сериала"
            />
          </div>
          <div className={styles.selectorField}>
            <span>Возрастной рейтинг</span>
            <Select
              options={ageRatingOptions}
              value={ageRating}
              onChange={setAgeRating}
              placeholder="Не указан"
              ariaLabel="Возрастной рейтинг"
            />
          </div>
          <label>
            Дата релиза
            <input type="date" name="originalReleaseDate" />
          </label>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.selectorField}>
            <span>Жанр</span>
            <div className={styles.inlineRow}>
              <Select
                options={genreOptions}
                value={selectedGenre}
                onChange={setSelectedGenre}
                ariaLabel="Жанр"
              />
              <button type="button" onClick={handleAddGenre}>
                Добавить
              </button>
            </div>
            <div className={styles.chipRow}>
              {addedGenres.length === 0 ? (
                <span className={styles.chipEmpty}>—</span>
              ) : (
                addedGenres.map((genre) => (
                  <span className={styles.chip} key={`genre-${genre}`}>
                    {genre}
                    <input type="hidden" name="genres" value={genre} />
                  </span>
                ))
              )}
            </div>
          </div>

          <div className={styles.selectorField}>
            <span>Тег</span>
            <div className={styles.inlineRow}>
              <Select
                options={tagOptions}
                value={selectedTag}
                onChange={setSelectedTag}
                ariaLabel="Тег"
              />
              <button type="button" onClick={handleAddTag}>
                Добавить
              </button>
            </div>
            <div className={styles.chipRow}>
              {addedTags.length === 0 ? (
                <span className={styles.chipEmpty}>—</span>
              ) : (
                addedTags.map((tag) => (
                  <span className={styles.chip} key={`tag-${tag}`}>
                    #{tag}
                    <input type="hidden" name="tags" value={tag} />
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.selectorField}>
          <span>Обложка</span>
          <FileField
            onSelect={handleCoverSelect}
            disabled={isUploadingCover}
            buttonLabel={isUploadingCover ? "Загружаем…" : "Выбрать файл"}
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
                width={104}
                height={140}
              />
            ) : null}
          </FileField>
        </div>

        <label className={styles.checkboxRow}>
          <input name="published" type="checkbox" />
          Опубликовать сразу
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
