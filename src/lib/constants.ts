import { Category, Product, RestaurantProfile } from "../types";

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  category: string;
  accentBg: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "amber", name: "Amber Roast", hex: "#D97706", category: "Warm", accentBg: "rgba(217, 119, 6, 0.15)" },
  { id: "terracotta", name: "Terracotta Clay", hex: "#E05A47", category: "Warm", accentBg: "rgba(224, 90, 71, 0.15)" },
  { id: "emerald", name: "Sage Botanical", hex: "#059669", category: "Natural", accentBg: "rgba(5, 150, 105, 0.15)" },
  { id: "burgundy", name: "Bordeaux Noir", hex: "#9F1239", category: "Luxe", accentBg: "rgba(159, 18, 57, 0.15)" },
  { id: "indigo", name: "Deep Indigo", hex: "#4F46E5", category: "Modern", accentBg: "rgba(79, 70, 229, 0.15)" },
  { id: "slate", name: "Nordic Charcoal", hex: "#334155", category: "Minimal", accentBg: "rgba(51, 65, 85, 0.15)" },
  { id: "copper", name: "Burnt Sienna", hex: "#B45309", category: "Warm", accentBg: "rgba(180, 83, 9, 0.15)" },
  { id: "gold", name: "Champagne Gold", hex: "#CA8A04", category: "Luxe", accentBg: "rgba(202, 138, 4, 0.15)" },
];

export const COVER_PRESETS = [
  {
    id: "cafe-artisan",
    title: "Specialty Cafe Bar",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    previewUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "bakery-spread",
    title: "Artisan Bakery Table",
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    previewUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "minimal-interior",
    title: "Warm Minimalist Dining",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    previewUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "bistro-mood",
    title: "Atmospheric Bistro",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    previewUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "cocktail-lounge",
    title: "Craft Bar & Cocktails",
    url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
    previewUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=300&q=80"
  }
];

export const LOGO_PRESETS = [
  {
    id: "coffee-cup",
    label: "Coffee Cup Icon",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "croissant",
    label: "Bakery Emblem",
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "plate",
    label: "Culinary Dish",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80"
  }
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Specialty Espresso",
    description: "Single-origin beans freshly extracted with precision",
    icon: "Coffee",
    sortOrder: 1,
  },
  {
    id: "cat-2",
    name: "Cold Brew & Iced",
    description: "Slow-steeped for 18 hours, served over crystal ice",
    icon: "GlassWater",
    sortOrder: 2,
  },
  {
    id: "cat-3",
    name: "Pastries & Sourdough",
    description: "Baked daily at dawn with cultured Normandy butter",
    icon: "Croissant",
    sortOrder: 3,
  },
  {
    id: "cat-4",
    name: "Artisan Brunch",
    description: "Seasonal farm-to-table plates available until 3 PM",
    icon: "Utensils",
    sortOrder: 4,
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Oat Cortado (Ethiopia Guji)",
    price: 4.75,
    categoryId: "cat-1",
    description: "Equal parts double espresso and silky steamed minor figures oat milk, notes of bergamot and wild jasmine.",
    imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80",
    tags: ["Popular", "Vegan"],
    isAvailable: true,
  },
  {
    id: "prod-2",
    name: "Vanilla Bean Cold Foam Brew",
    price: 5.50,
    categoryId: "cat-2",
    description: "Cold brewed Colombian roast topped with whipped Madagascar vanilla sweet cold foam.",
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
    tags: ["Popular"],
    isAvailable: true,
  },
  {
    id: "prod-3",
    name: "Pistachio Cardamom Croissant",
    price: 5.25,
    categoryId: "cat-3",
    description: "Twice-baked flaky butter croissant stuffed with rich Sicilian pistachio frangipane and ground cardamom.",
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    tags: ["Chef's Special", "Popular"],
    isAvailable: true,
  },
  {
    id: "prod-4",
    name: "Avocado & Yuzu Sourdough Toast",
    price: 13.50,
    categoryId: "cat-4",
    description: "Whipped Hass avocado, Meyer lemon, organic micro-radish, Aleppo pepper chili flakes on toasted heirloom sourdough.",
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
    tags: ["Organic", "Vegan"],
    isAvailable: true,
  },
  {
    id: "prod-5",
    name: "Single Origin Batch Brew",
    price: 4.00,
    categoryId: "cat-1",
    description: "Rotated daily filter roast brewed on Marco precision batch brewer.",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
    tags: [],
    isAvailable: true,
  },
  {
    id: "prod-6",
    name: "Wild Berry Matcha Latte",
    price: 6.00,
    categoryId: "cat-2",
    description: "Ceremonial Uji matcha layered over crushed organic raspberry puree and almond milk.",
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
    tags: ["Popular", "New"],
    isAvailable: true,
  },
];

export const INITIAL_RESTAURANT_DATA: RestaurantProfile = {
  name: "Velvet & Stone Coffee",
  slug: "velvet-stone",
  businessType: "specialty_coffee",
  currency: "USD",
  logoUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80",
  address: "742 Evergreen Terrace, Downtown District",
  tableOrdering: true,
  branding: {
    primaryColor: "#D97706",
    coverImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    tagline: "Artisan single-origins & seasonal pastries, roasted with passion.",
    menuLayoutTheme: "editorial",
    showPrices: true,
  },
  categories: DEFAULT_CATEGORIES,
  products: DEFAULT_PRODUCTS,
};
