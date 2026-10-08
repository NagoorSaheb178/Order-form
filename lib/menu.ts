// lib/menu.ts

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
  },
];
