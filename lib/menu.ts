// lib/menu.ts

import type { CategoryId } from "./categories";

export type MenuItem = {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

export const MENU_ITEMS: MenuItem[] = [
  // 1) SNACKS & STARTERS
  {
    id: "crispy-chicken",
    categoryId: "snacks",
    name: "Crispy Chicken Fry",
    description: "Golden fried chicken tossed in house masala.",
    price: 150,
    imageUrl:
      "https://www.licious.in/blog/wp-content/uploads/2019/05/Drumsticks-liquidation-plan-05.jpg",
  },
  {
    id: "paneer-tikka",
    categoryId: "snacks",
    name: "Paneer Tikka",
    description: "Smoky grilled paneer cubes marinated overnight.",
    price: 160,
    imageUrl:
      "https://lentillovingfamily.com/wp-content/uploads/2025/08/paneer-tikka-2.jpg",
  },

  // 2) SIDE DISHES
  {
    id: "veg-momos",
    categoryId: "sides",
    name: "Veg Momos",
    description: "Soft dumplings filled with fresh veggies & herbs.",
    price: 120,
    imageUrl:
      "https://www.yummytummyaarthi.com/wp-content/uploads/2017/09/1-30.jpg",
  },
  {
    id: "french-fries",
    categoryId: "sides",
    name: "French Fries",
    description: "Crispy golden fries with light seasoning.",
    price: 90,
    imageUrl:
      "https://www.kuchpakrahahai.in/wp-content/uploads/2023/05/Air-fryer-french-fries-recipe.jpg",
  },

  // 3) CHICKEN MAIN COURSE
  {
    id: "butter-chicken",
    categoryId: "chicken",
    name: "Butter Chicken",
    description: "Creamy tomato gravy with tender tandoori chicken.",
    price: 260,
    imageUrl:
      "https://majasrecipes.com/wp-content/uploads/2024/12/butter-chicken-recipe-5.jpg",
  },
  {
    id: "chicken-biryani",
    categoryId: "chicken",
    name: "Chicken Biryani",
    description: "Aromatic basmati rice layered with juicy chicken.",
    price: 220,
    imageUrl:
      "https://www.cubesnjuliennes.com/wp-content/uploads/2020/07/Chicken-Biryani-Recipe.jpg",
  },

  // 4) MUTTON MAIN COURSE
  {
    id: "mutton-korma",
    categoryId: "mutton",
    name: "Mutton Korma",
    description: "Slow-cooked mutton in a rich, spiced gravy.",
    price: 300,
    imageUrl:
      "https://static.toiimg.com/photo/52554168.cms",
  },
  {
    id: "mutton-biryani",
    categoryId: "mutton",
    name: "Mutton Biryani",
    description: "Royal biryani made with premium mutton cuts.",
    price: 330,
    imageUrl:
      "https://www.cubesnjuliennes.com/wp-content/uploads/2021/03/Best-Mutton-Biryani-Recipe.jpg",
  },

  // 5) DESSERTS
  {
    id: "gulab-jamun",
    categoryId: "desserts",
    name: "Gulab Jamun",
    description: "Soft khoya dumplings soaked in warm sugar syrup.",
    price: 80,
    imageUrl:
      "https://images.slurrp.com/prod/recipe_images/transcribe/dessert/Gulab-jamun.webp",
  },
  {
    id: "brownie-icecream",
    categoryId: "desserts",
    name: "Brownie with Ice Cream",
    description: "Warm chocolate brownie topped with vanilla scoop.",
    price: 150,
    imageUrl:
      "https://www.cookwithkushi.com/wp-content/uploads/2017/01/sizzling_brownie_sundae_ice_cream.jpg",
  },
];
