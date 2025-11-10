export const GENRE_KEYWORDS = [
  "приключения",
  "фэнтези",
  "фантастика",
  "комедия",
  "драма",
  "романтика",
  "триллер",
  "ужасы",
  "боевик",
  "меха",
  "спорт",
  "повседневность",
] as const;

export const GENRE_KEYWORD_SET = new Set<string>(GENRE_KEYWORDS);

export type GenreKeyword = (typeof GENRE_KEYWORDS)[number];

export const detectGenres = (description?: string | null): GenreKeyword[] => {
  const normalized = description?.toLowerCase() ?? "";
  return GENRE_KEYWORDS.filter((genre) => normalized.includes(genre));
};
