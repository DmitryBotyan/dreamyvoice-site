'use client';

/* eslint-disable @next/next/no-img-element */

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { UpdateTitleFormState } from "./actions";
import { clientConfig } from "@/lib/client-config";
import { buildMediaUrl } from "@/lib/media";
import { AGE_RATINGS, TAG_KEYWORDS } from "@/lib/catalog-keywords";
import styles from "../../styles.module.css";
import { Select } from "../../../ui/select";
import { FileField } from "../../../ui/file-field";
import { GENRE_KEYWORDS } from "@/lib/genres";
import {
  DEFAULT_TITLE_STATUS,
  TITLE_STATUS_OPTIONS,
  extractStatusFromTags,
  stripStatusTags,
  type TitleStatus,
} from "@/lib/title-status";

const initialState: UpdateTitleFormState = { success: false };

const AGE_RATING_OPTIONS = [
  { value: "", label: "Не указан" },
  ...AGE_RATINGS.map((rating) => ({ value: rating, label: rating })),
];

const AGGREGATOR_OPTIONS = [
  { value: "", label: "Не задан" },
  { value: "kp", label: "Кинопоиск (kp)" },
  { value: "mali", label: "MyAnimeList (mali)" },
  { value: "mdl", label: "MyDramaList (mdl)" },
];

const toOptions = (values: string[]) =>
  values.map((value) => ({ value, label: value }));

type Props = {
  action: (state: UpdateTitleFormState, formData: FormData) => Promise<UpdateTitleFormState>;
  initialValues: {
    name: string;
    description?: string | null;
    coverKey?: string | null;
    coverBlurHash?: string | null;
    published: boolean;
    genres: string[];
    tags: string[];
    ageRating?: string | null;
    originalReleaseDate?: string | null;
    cvhAggregator?: string | null;
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
  const [coverBlurHash, setCoverBlurHash] = useState(initialValues.coverBlurHash ?? '');
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [genreOptions] = useState<string[]>(() => [...GENRE_KEYWORDS]);
  const [tagOptions] = useState<string[]>(() => [...TAG_KEYWORDS]);
  const [selectedGenre, setSelectedGenre] = useState(genreOptions[0] ?? "");
  const [selectedTag, setSelectedTag] = useState(tagOptions[0] ?? "");
  const [addedGenres, setAddedGenres] = useState<string[]>(initialValues.genres);
  const initialStatus =
    extractStatusFromTags(initialValues.tags) ?? DEFAULT_TITLE_STATUS;
  const [titleStatus, setTitleStatus] =
    useState<TitleStatus>(initialStatus);
  const [addedTags, setAddedTags] = useState<string[]>(
    stripStatusTags(initialValues.tags)
  );
  const [ageRating, setAgeRating] = useState(initialValues.ageRating ?? "");
  const [aggregator, setAggregator] = useState(initialValues.cvhAggregator ?? "");
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
        const filteredTags = stripStatusTags(tags);
        if (filteredTags.length > 0) {
          setSelectedTag((prev) =>
            filteredTags.includes(prev) ? prev : filteredTags[0]
          );
        }
      } catch {
        // справочники не критичны — остаются значения по умолчанию
      }
    }
    loadMetadata();
    return () => {
      active = false;
    };
  }, []);

  async function handleCoverUpload(file: File) {
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
    setCoverBlurHash(data.blurHash ?? '');
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
            maxLength={255}
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
        <input type="hidden" name="titleStatus" value={titleStatus} />
        <input type="hidden" name="ageRating" value={ageRating} />
        <input type="hidden" name="cvhAggregator" value={aggregator} />
        <input type="hidden" name="coverBlurHash" value={coverBlurHash} />

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
              options={AGE_RATING_OPTIONS}
              value={ageRating}
              onChange={setAgeRating}
              placeholder="Не указан"
              ariaLabel="Возрастной рейтинг"
            />
          </div>
          <label>
            Дата релиза
            <input
              type="date"
              name="originalReleaseDate"
              defaultValue={releaseDateValue}
            />
          </label>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.selectorField}>
            <span>Жанр</span>
            <div className={styles.inlineRow}>
              <Select
                options={toOptions(genreOptions)}
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
                  <span className={styles.chip} key={`genre-chip-${genre}`}>
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
                options={toOptions(tagOptions)}
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
                  <span className={styles.chip} key={`tag-chip-${tag}`}>
                    #{tag}
                    <input type="hidden" name="tags" value={tag} />
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.selectorField}>
            <span>Агрегатор CDNVideoHub</span>
            <Select
              options={AGGREGATOR_OPTIONS}
              value={aggregator}
              onChange={setAggregator}
              placeholder="Не задан"
              ariaLabel="Агрегатор CDNVideoHub"
            />
          </div>
          <label>
            Ключ обложки
            <input
              type="text"
              name="coverKey"
              maxLength={255}
              value={coverKey}
              onChange={(event) => {
                setCoverKey(event.target.value);
                setCoverBlurHash('');
              }}
            />
          </label>
        </div>

        <div className={styles.selectorField}>
          <span>Обложка</span>
          <FileField
            onSelect={handleCoverUpload}
            disabled={isUploadingCover}
            buttonLabel={isUploadingCover ? "Загружаем…" : "Заменить обложку"}
          >
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
                width={104}
                height={140}
              />
            ) : null}
          </FileField>
        </div>

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
