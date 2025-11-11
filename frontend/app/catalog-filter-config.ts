import { AGE_RATINGS } from "@/lib/catalog-keywords";

export type SortOption = "name_asc" | "name_desc" | "created_desc" | "created_asc";

export const SORT_OPTIONS: SortOption[] = [
  "name_asc",
  "name_desc",
  "created_desc",
  "created_asc",
];

export const DEFAULT_SORT: SortOption = "created_desc";

export type CatalogFilterState = {
  query: string;
  yearFrom?: number;
  yearTo?: number;
  genre?: string;
  tag?: string;
  status: "all" | "ongoing" | "released";
  ageRating?: (typeof AGE_RATINGS)[number];
  sort: SortOption;
};
