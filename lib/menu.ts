export type CategoryId = "I" | "II" | "III" | "IV";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: CategoryId;
}

export const MENU_ITEMS: MenuItem[] = [
  // I) SNACKS & STARTERS
  {
    id: "pomfret-masala-fry",
    name: "Pomfret Masala Fry (1 pc)",
    description:
      "White fresh marinated pomfret fried and tossed with onion and green chilli; served with salad.",
    price: 375,
    categoryId: "I",
  },
  {
    id: "kolkata-fish-fry-bhetki",
    name: "Kolkata Fish Fry Bhetki (1 pc)",
    description:
      "Bhetki fillet marinated with secret spices, coated with egg & breadcrumbs, deep fried; served with salad, mustard sauce, tartar sauce.",
    price: 199,
    categoryId: "I",
  },
  {
    id: "fish-finger-bhetki",
    name: "Fish Finger Bhetki (4 pc)",
    description:
      "Finger-shaped bhetki fillets coated with breadcrumbs & egg; fried and served with salad, mustard sauce, tartar sauce.",
    price: 320,
    categoryId: "I",
  },
  {
    id: "dry-chilli-fish-bhetki",
    name: "Dry Chilli Fish Bhetki (6 pc)",
    description: "Indo-Chinese style spicy chilli fish.",
    price: 390,
    categoryId: "I",
  },

  // II) SIDE DISHES (NON-VEG)
  {
    id: "macher-matha-diye-dal",
    name: "Macher Matha Diye Dal",
    description:
      "Roasted moong dal cooked with fried katla fish head & spices.",
    price: 160,
    categoryId: "II",
  },
  {
    id: "muri-ghonto",
    name: "Muri Ghonto",
    description: "Bengali curry of potato, fish head & gobindo bhog rice.",
    price: 175,
    categoryId: "II",
  },
  {
    id: "kochupata-chingri-bhapa",
    name: "Kochupata Chingri Bhapa",
    description:
      "Steamed prawns with colocasia leaves in a special chef’s recipe.",
    price: 275,
    categoryId: "II",
  },
  {
    id: "mocha-chingri",
    name: "Mocha Chingri",
    description:
      "Banana flowers cooked with potatoes, shrimps & spices.",
    price: 275,
    categoryId: "II",
  },

  // III) MAIN COURSE – CHICKEN
  {
    id: "chicken-kosha-bhuna",
    name: "Chicken Kosha Bhuna (4 pc)",
    description:
      "Chicken cooked in onion, ginger-garlic paste & masala gravy.",
    price: 340,
    categoryId: "III",
  },
  {
    id: "lebu-lonka-murgi",
    name: "Lebu Lonka Murgi (B/L 6 pc)",
    description:
      "Boneless chicken in yogurt, green chilli & gondhoraj lemon.",
    price: 280,
    categoryId: "III",
  },
  {
    id: "chicken-dakbunglow",
    name: "Chicken Dakbunglow (4 pc)",
    description: "Colonial-era rich chicken curry cooked with eggs.",
    price: 360,
    categoryId: "III",
  },
  {
    id: "kala-bhuna-chicken",
    name: "Kala Bhuna Chicken (4 pc)",
    description: "Spicy black onion chicken gravy.",
    price: 360,
    categoryId: "III",
  },

  // IV) MAIN COURSE – MUTTON & DESSERT
  {
    id: "mutton-kosha",
    name: "Mutton Kosha (4 pc)",
    description: "Slow-cooked rich brown mutton curry.",
    price: 470,
    categoryId: "IV",
  },
  {
    id: "kochhi-pathar-mangsho-jhol",
    name: "Kochi Pathar Mangsho Jhol (4 pc)",
    description: "Light Bengali mutton curry with potato.",
    price: 480,
    categoryId: "IV",
  },
  {
    id: "kala-bhuna-mutton",
    name: "Kala Bhuna Mutton (4 pc)",
    description: "Spicy burnt black onion mutton gravy.",
    price: 490,
    categoryId: "IV",
  },
  {
    id: "nolen-gurer-payesh",
    name: "Nolen Gurer Payesh",
    description: "Gobindo bhog rice pudding in jaggery.",
    price: 120,
    categoryId: "IV",
  },
];
