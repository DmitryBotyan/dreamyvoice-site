const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ё/g, 'е')
    .trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const TAG_KEYWORDS = [
  'bdrip',
  'webrip',
  'школа',
  'олдскул',
  'магия',
  'hdtvrip',
  'демоны',
  'война',
  'космос',
  'роботы',
  'любовь',
  'вампиры',
  'оружие',
  'будущее',
  'дружба',
  'сражения',
  'повседневность',
  'клуб',
  'кровь',
  'друзья',
  'супер сила',
  'боги',
  'dvdrip',
] as const;

export const TRANSLATION_TYPES = ['Дубляж', 'Закадровая', 'Рекаст', 'Субтитры'] as const;

export const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'R+', 'Rx'] as const;

export type TagKeyword = (typeof TAG_KEYWORDS)[number];
export type TranslationKind = (typeof TRANSLATION_TYPES)[number];
export type AgeRating = (typeof AGE_RATINGS)[number];

export const TAG_KEYWORD_SET = new Set<string>(TAG_KEYWORDS);
export const TRANSLATION_TYPE_SET = new Set<string>(TRANSLATION_TYPES);
export const AGE_RATING_SET = new Set<string>(AGE_RATINGS);

export const detectTags = (description?: string | null): TagKeyword[] => {
  if (!description) {
    return [];
  }

  const normalizedDescription = normalizeText(description);

  return TAG_KEYWORDS.filter((tag) =>
    normalizedDescription.includes(normalizeText(tag)),
  );
};

export const detectTranslationTypes = (
  description?: string | null,
): TranslationKind[] => {
  if (!description) {
    return [];
  }

  const normalizedDescription = normalizeText(description);

  return TRANSLATION_TYPES.filter((type) =>
    normalizedDescription.includes(normalizeText(type)),
  );
};

const matchesStandaloneKeyword = (source: string, keyword: string) => {
  const pattern = new RegExp(
    `(^|[^A-Z0-9\\+\\-])${escapeRegExp(keyword)}([^A-Z0-9\\+\\-]|$)`,
    'i',
  );
  return pattern.test(source);
};

export const detectAgeRating = (description?: string | null): AgeRating | null => {
  if (!description) {
    return null;
  }

  for (const rating of AGE_RATINGS) {
    if (matchesStandaloneKeyword(description, rating)) {
      return rating;
    }
  }

  return null;
};
