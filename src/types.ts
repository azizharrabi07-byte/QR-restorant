export type BusinessType = 
  | "specialty_coffee"
  | "artisan_bakery"
  | "casual_dining"
  | "fine_dining"
  | "bistro_bar"
  | "pizzeria"
  | "dessert_lounge";

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

export type DietaryTag = "Popular" | "Vegan" | "Gluten-Free" | "Organic" | "Chef's Special" | "New" | "Spicy";

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  imageUrl?: string;
  tags?: DietaryTag[];
  isAvailable: boolean;
}

export interface BrandingConfig {
  primaryColor: string;
  coverImage?: string;
  tagline?: string;
  menuLayoutTheme?: "minimal" | "editorial" | "vibrant";
  showPrices: boolean;
}

export interface RestaurantTable {
  id: string;
  table_number: number;
  qr_token: string;
}

// Backward compatibility alias
export type TableItem = RestaurantTable & {
  tableNumber?: number;
  token?: string;
};

export interface RestaurantProfile {
  name: string;
  slug: string;
  businessType: BusinessType;
  currency: string;
  logoUrl?: string;
  address?: string;
  tableOrdering: boolean;
  branding: BrandingConfig;
  categories: Category[];
  products: Product[];
  tableCount?: number;
  tables?: RestaurantTable[];
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface StepDefinition {
  step: OnboardingStep;
  title: string;
  shortTitle: string;
  description: string;
}

export type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  price_snapshot?: number;
  created_at?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: OrderStatus;
  total: number;
  daily_order_number?: number | string;
  created_at: string;
  updated_at?: string;
  table_number?: number;
  restaurant_tables?: {
    id: string;
    table_number: number;
    qr_token?: string;
  } | null;
  order_items?: OrderItem[];
}

export interface CustomerCartItem {
  product: Product;
  quantity: number;
}

export type WorkerRole = "cashier" | "kitchen" | "manager";

export interface WorkerInvite {
  id: string;
  restaurant_id: string;
  invite_token: string;
  role: WorkerRole;
  is_used: boolean;
  used_by: string | null;
  expires_at: string;
  created_at: string;
  used_by_email?: string;
  used_by_name?: string;
}
