// lib/menu.ts

<<<<<<< HEAD
export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: number; // in Indian Rupees (₹)
  cat: string;
  tags: string[];
  img: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "bruschetta",
    name: "Tomato & basil bruschetta",
    desc: "Charred sourdough, heirloom tomato, basil oil.",
    price: 160,
    cat: "Starters",
    tags: ["Vegetarian"],
    img: "https://images.pexels.com/photos/11789787/pexels-photo-11789787.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "burrata",
    name: "Burrata caprese",
    desc: "Creamy burrata, cherry tomato, basil, pine nuts.",
    price: 240,
    cat: "Starters",
    tags: ["Vegetarian", "Gluten-free"],
    img: "https://images.pexels.com/photos/3510248/pexels-photo-3510248.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "calamari",
    name: "Crispy calamari",
    desc: "Lemon, parsley, smoked paprika aioli.",
    price: 280,
    cat: "Starters",
    tags: [],
    img: "https://images.pexels.com/photos/19119775/pexels-photo-19119775.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "salmon",
    name: "Market salmon",
    desc: "Asparagus, lemon beurre blanc, herb potato.",
    price: 450,
    cat: "Mains",
    tags: ["Gluten-free"],
    img: "https://images.pexels.com/photos/12318013/pexels-photo-12318013.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "risotto",
    name: "Wild mushroom risotto",
    desc: "Porcini, parmesan, chive, aged balsamic.",
    price: 340,
    cat: "Mains",
    tags: ["Vegetarian", "Gluten-free"],
    img: "https://images.pexels.com/photos/5638527/pexels-photo-5638527.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "steak",
    name: "Rosemary ribeye",
    desc: "Grass-fed ribeye, seasonal greens, jus.",
    price: 490,
    cat: "Mains",
    tags: ["Gluten-free"],
    img: "https://images.pexels.com/photos/36604683/pexels-photo-36604683.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "pasta",
    name: "Pappardelle ragù",
    desc: "Slow-cooked beef ragù, pecorino, parsley.",
    price: 360,
    cat: "Mains",
    tags: [],
    img: "https://images.pexels.com/photos/31992856/pexels-photo-31992856.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "fries",
    name: "Parmesan truffle fries",
    desc: "Crisp potatoes, parmesan, truffle salt.",
    price: 150,
    cat: "Sides",
    tags: ["Vegetarian"],
    img: "https://images.pexels.com/photos/31806278/pexels-photo-31806278.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "vegetables",
    name: "Grilled garden vegetables",
    desc: "Zucchini, peppers, onion, herb vinaigrette.",
    price: 160,
    cat: "Sides",
    tags: ["Vegan", "Gluten-free"],
    img: "https://images.pexels.com/photos/36183197/pexels-photo-36183197.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "tiramisu",
    name: "Classic tiramisù",
    desc: "Espresso-soaked biscuit, mascarpone, cocoa.",
    price: 180,
    cat: "Desserts",
    tags: ["Vegetarian"],
    img: "https://images.pexels.com/photos/19992962/pexels-photo-19992962.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "panna",
    name: "Vanilla panna cotta",
    desc: "Berry coulis, toasted pistachio.",
    price: 160,
    cat: "Desserts",
    tags: ["Gluten-free"],
    img: "https://images.pexels.com/photos/3301907/pexels-photo-3301907.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "espresso",
    name: "Double espresso",
    desc: "Aster house roast, dark chocolate finish.",
    price: 90,
    cat: "Drinks",
    tags: ["Vegan", "Gluten-free"],
    img: "https://images.pexels.com/photos/12975714/pexels-photo-12975714.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "wine",
    name: "Olive grove red",
    desc: "Sangiovese blend, glass pour.",
    price: 290,
    cat: "Drinks",
    tags: ["Vegan", "Gluten-free"],
    img: "https://images.pexels.com/photos/14978299/pexels-photo-14978299.jpeg?auto=compress&cs=tinysrgb&w=600",
=======
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
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
  },
];
