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
  const [genreOptions] = useState<string[]>(GENRE_KEYWORDS);
  const [tagOptions] = useState<string[]>(TAG_KEYWORDS);
  const [selectedGenre, setSelectedGenre] = useState(genreOptions[0] ?? "");
  const [selectedTag, setSelectedTag] = useState(tagOptions[0] ?? "");
  const [addedGenres, setAddedGenres] = useState<string[]>([]);
  const [addedTags, setAddedTags] = useState<string[]>([]);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoverKey(null);
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
        <div className={styles.metadataGrid}>
          <label>
            Жанр
            <div className={styles.inlineRow}>
              <select
                name="genrePicker"
                value={selectedGenre}
                onChange={(event) => setSelectedGenre(event.target.value)}
              >
                {genreOptions.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddGenre}>
                Добавить
              </button>
            </div>
          </label>
          <label>
            Тег
            <div className={styles.inlineRow}>
              <select
                name="tagPicker"
                value={selectedTag}
                onChange={(event) => setSelectedTag(event.target.value)}
              >
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddTag}>
                Добавить
              </button>
            </div>
          </label>
          <label>
            Возрастной рейтинг
            <select name="ageRating" defaultValue="">
              <option value="">Не указан</option>
              {AGE_RATINGS.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          </label>
          <label>
            Оригинальная дата релиза
            <input type="date" name="originalReleaseDate" />
          </label>
        </div>
        <div className={styles.chipRow}>
          {addedGenres.map((genre) => (
            <span className={styles.chip} key={`genre-chip-${genre}`}>
              {genre}
              <input type="hidden" name="genres" value={genre} />
            </span>
          ))}
        </div>
        <div className={styles.chipRow}>
          {addedTags.map((tag) => (
            <span className={styles.chip} key={`tag-chip-${tag}`}>
              {tag}
              <input type="hidden" name="tags" value={tag} />
            </span>
          ))}
        </div>
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
