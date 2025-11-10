const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ё/g, 'е')
    .trim();

export const GENRE_KEYWORDS = [
  'экшен',
  'комедия',
  'драма',
  'фэнтези',
  'сверхъестественное',
  'фантастика',
  'сёнен',
  'романтика',
  'приключения',
  'повседневность',
  'сейнен',
  'этти',
  'детектив',
  'меха',
  'военное',
  'психологическое',
  'ужасы',
  'исторический',
  'спорт',
  'сёдзё',
  'триллер',
  'музыка',
  'пародия',
  'игры',
  'боевые искусства',
  'сёдзё-ай',
  'дзёсей',
] as const;

export const GENRE_KEYWORD_SET = new Set<string>(GENRE_KEYWORDS);

export type GenreKeyword = (typeof GENRE_KEYWORDS)[number];

export const detectGenres = (description?: string | null): GenreKeyword[] => {
  const normalizedDescription = normalizeText(description ?? '');

  return GENRE_KEYWORDS.filter((genre) =>
    normalizedDescription.includes(normalizeText(genre)),
  );
};
