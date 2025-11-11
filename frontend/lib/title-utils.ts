import type { Title } from "./types";

const parseIsoDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value.trim());
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

export const getReleaseDate = (title: Title): Date => {
  return (
    parseIsoDate(title.originalReleaseDate) ??
    parseIsoDate(title.createdAt) ??
    new Date()
  );
};

export const getReleaseTimestamp = (title: Title): number =>
  getReleaseDate(title).getTime();

export const sortTitlesByReleaseDateDesc = (titles: Title[]): Title[] =>
  [...titles].sort(
    (a, b) => getReleaseTimestamp(b) - getReleaseTimestamp(a),
  );
