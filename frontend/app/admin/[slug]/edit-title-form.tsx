'use client';

/* eslint-disable @next/next/no-img-element */

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { UpdateTitleFormState } from "./actions";
import { clientConfig } from "@/lib/client-config";
import { buildMediaUrl } from "@/lib/media";
import { AGE_RATINGS, TAG_KEYWORDS } from "@/lib/catalog-keywords";
import styles from "../styles.module.css";
import { GENRE_KEYWORDS } from "@/lib/genres";

const initialState: UpdateTitleFormState = { success: false };

type Props = {
  action: (state: UpdateTitleFormState, formData: FormData) => Promise<UpdateTitleFormState>;
  initialValues: {
    name: string;
    description?: string | null;
    coverKey?: string | null;
    published: boolean;
    genres: string[];
    tags: string[];
    ageRating?: string | null;
    originalReleaseDate?: string | null;
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
  const [genreOptions] = useState<string[]>(GENRE_KEYWORDS);
  const [tagOptions] = useState<string[]>(TAG_KEYWORDS);
  const [selectedGenre, setSelectedGenre] = useState(genreOptions[0] ?? "");
  const [selectedTag, setSelectedTag] = useState(tagOptions[0] ?? "");
  const [addedGenres, setAddedGenres] = useState<string[]>(initialValues.genres);
  const [addedTags, setAddedTags] = useState<string[]>(initialValues.tags);
  const [, setMetadataError] = useState<string | null>(null);
  const releaseDateValue = initialValues.originalReleaseDate
    ? initialValues.originalReleaseDate.split('T')[0]
    : '';

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

  useEffect(() => {
    let active = true;
    async function loadMetadata() {
      try {
        const [genresRes, tagsRes] = await Promise.all([
          fetch(`${clientConfig.apiProxyBasePath}/metadata/genres`, { credentials: "include" }),
          fetch(`${clientConfig.apiProxyBasePath}/metadata/tags`, { credentials: "include" }),
        ]);
        if (!genresRes.ok || !tagsRes.ok) {
          throw new Error("Не удалось загрузить справочники");
        }
        const [{ genres }, { tags }] = await Promise.all([genresRes.json(), tagsRes.json()]);
        if (!active) return;
        if (genres.length > 0) {
          setSelectedGenre((prev) => (genres.includes(prev) ? prev : genres[0]));
        }
        if (tags.length > 0) {
          setSelectedTag((prev) => (tags.includes(prev) ? prev : tags[0]));
        }
      } catch (error) {
        if (active) {
          // ignore metadata errors silently
        }
      }
    }
    loadMetadata();
    return () => {
      active = false;
    };
  }, []);

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
            <select name="ageRating" defaultValue={initialValues.ageRating ?? ""}>
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
            <input
              type="date"
              name="originalReleaseDate"
              defaultValue={releaseDateValue}
            />
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
