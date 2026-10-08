// lib/categories.ts

<<<<<<< HEAD
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
=======
export type CategoryId = "snacks" | "sides" | "chicken" | "mutton" | "desserts";

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  snacks: "Snacks & Starters",
  sides: "Side Dishes",
  chicken: "Chicken Main Course",
  mutton: "Mutton Main Course",
  desserts: "Desserts",
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
};
