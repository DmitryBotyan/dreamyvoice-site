import type { EpisodeCredit } from './types';

/** Подсказки для поля роли в админке. Роль не ограничена этим списком. */
export const EPISODE_CREDIT_ROLE_SUGGESTIONS = [
  'Озвучка',
  'Перевод',
  'Редактура',
  'Тайминг',
  'Сведение звука',
  'Звукорежиссура',
  'Работа с видео',
  'Оформление',
  'Контроль качества',
] as const;

export type EpisodeCreditGroup = {
  role: string;
  credits: EpisodeCredit[];
};

/**
 * Группирует кредиты по роли, сохраняя порядок, заданный в админке:
 * роли идут в порядке первого появления, люди — в порядке добавления.
 */
export const groupCreditsByRole = (
  credits: EpisodeCredit[] = []
): EpisodeCreditGroup[] => {
  const groups = new Map<string, EpisodeCreditGroup>();

  credits.forEach((credit) => {
    const key = credit.role.trim().toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.credits.push(credit);
      return;
    }
    groups.set(key, { role: credit.role.trim(), credits: [credit] });
  });

  return Array.from(groups.values());
};
