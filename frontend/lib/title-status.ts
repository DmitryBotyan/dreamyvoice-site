import type { Title } from './types';

const STATUS_TAG_PREFIX = 'status:';

export const TITLE_STATUS_LABELS = {
  ongoing: 'Онгоинг',
  completed: 'Завершено',
  hiatus: 'Пауза',
} as const;

export type TitleStatus = keyof typeof TITLE_STATUS_LABELS;

export const TITLE_STATUS_OPTIONS = (Object.entries(TITLE_STATUS_LABELS) as Array<
  [TitleStatus, string]
>).map(([value, label]) => ({ value, label }));

export const DEFAULT_TITLE_STATUS: TitleStatus = 'ongoing';

const normalize = (value: string) => value.trim().toLowerCase();

export const isStatusTag = (value: string) => normalize(value).startsWith(STATUS_TAG_PREFIX);

export const encodeStatusTag = (status: TitleStatus) => `${STATUS_TAG_PREFIX}${status}`;

export const extractStatusFromTags = (tags?: string[]): TitleStatus | null => {
  if (!tags || tags.length === 0) {
    return null;
  }

  const statusTag = tags.find((tag) => isStatusTag(tag));
  if (!statusTag) {
    return null;
  }

  const rawValue = normalize(statusTag).slice(STATUS_TAG_PREFIX.length);
  return isValidStatus(rawValue) ? rawValue : null;
};

export const stripStatusTags = (tags: string[]): string[] =>
  tags.filter((tag) => !isStatusTag(tag));

export const normalizeStatusValue = (value?: string | null): TitleStatus | null => {
  if (!value) {
    return null;
  }
  const normalized = normalize(value);
  return isValidStatus(normalized) ? normalized : null;
};

export const titleStatusToProgress = (status: TitleStatus): 'ongoing' | 'completed' =>
  status === 'completed' ? 'completed' : 'ongoing';

export function isValidStatus(value: string): value is TitleStatus {
  return Object.prototype.hasOwnProperty.call(TITLE_STATUS_LABELS, value);
}

type TitleProgressSource = Pick<Title, 'published' | 'episodes' | 'tags'>;

/** Тайтл считается завершённым, когда он опубликован и в нём нет неопубликованных серий. */
const detectEpisodeProgress = (
  title: TitleProgressSource,
): 'ongoing' | 'completed' => {
  const hasUnreleasedEpisodes = title.episodes.some((episode) => !episode.published);
  return title.published && !hasUnreleasedEpisodes ? 'completed' : 'ongoing';
};

/** Явный статус из тега `status:*` приоритетнее автоматического определения по сериям. */
export const resolveTitleProgress = (
  title: TitleProgressSource,
): 'ongoing' | 'completed' => {
  const explicitStatus = extractStatusFromTags(title.tags);
  return explicitStatus ? titleStatusToProgress(explicitStatus) : detectEpisodeProgress(title);
};

export const isOngoingTitle = (title: TitleProgressSource) =>
  resolveTitleProgress(title) === 'ongoing';
