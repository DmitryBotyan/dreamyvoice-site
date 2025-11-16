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
