// lib/categories.ts

export type CategoryId = "snacks" | "sides" | "chicken" | "mutton" | "desserts";

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  snacks: "Snacks & Starters",
  sides: "Side Dishes",
  chicken: "Chicken Main Course",
  mutton: "Mutton Main Course",
  desserts: "Desserts",
};
