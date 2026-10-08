// lib/categories.ts

export const CATEGORIES = [
  "Popular",
  "Starters",
  "Mains",
  "Sides",
  "Desserts",
  "Drinks",
] as const;

export type CategoryName = (typeof CATEGORIES)[number];
export type CategoryId = string;

export const CATEGORY_LABELS: Record<string, string> = {
  Popular: "Popular",
  Starters: "Starters",
  Mains: "Mains",
  Sides: "Sides",
  Desserts: "Desserts",
  Drinks: "Drinks",
};
