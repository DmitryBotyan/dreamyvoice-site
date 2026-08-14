const formatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
});

export const formatNewsDate = (value: string) => formatter.format(new Date(value));
