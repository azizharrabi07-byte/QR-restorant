import { createClient, User } from "@supabase/supabase-js";
import { RestaurantProfile, RestaurantTable } from "../types";

const metaEnv = (typeof import.meta !== "undefined" && (import.meta as any).env) || {};

export const SUPABASE_URL = 
  metaEnv.VITE_SUPABASE_URL || "https://uejxcwsusinkkejhuuyp.supabase.co";

export const SUPABASE_KEY = 
  metaEnv.VITE_SUPABASE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlanhjd3N1c2lua2tlamh1dXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODczMDQzMywiZXhwIjoyMTA0MzA2NDMzfQ.4JEg--LAjUXlaAT-iuU_y_zwyKlMXV62tGq5DMtmnLM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Generate a standard UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Authentication API
export async function getSupabaseUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error("Error fetching Supabase user:", err);
    return null;
  }
}

export const getCurrentUser = getSupabaseUser;

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

export async function signInOwner(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || "Failed to sign in" };
  }
}

export async function signUpOwner(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // Attempt fast admin creation to avoid SMTP email rate limiting on development projects
    const adminRes = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (adminRes.data?.user) {
      // Auto login with the newly created account
      const login = await supabase.auth.signInWithPassword({ email, password });
      return { user: login.data?.user || adminRes.data.user, error: null };
    }

    if (adminRes.error) {
      // If user already exists, suggest signing in or attempt standard sign in
      if (adminRes.error.message.toLowerCase().includes("already registered") || adminRes.error.message.toLowerCase().includes("already exists")) {
        const login = await supabase.auth.signInWithPassword({ email, password });
        if (login.data?.user) {
          return { user: login.data.user, error: null };
        }
        return { user: null, error: "An account with this email already exists. Please sign in with your password." };
      }
      return { user: null, error: adminRes.error.message };
    }

    return { user: null, error: "Account creation could not be completed" };
  } catch (err: any) {
    return { user: null, error: err?.message || "Failed to create account" };
  }
}

export async function signOutOwner(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: any) {
    return { error: err?.message || "Failed to sign out" };
  }
}

export const signOut = signOutOwner;

export interface PublishResult {
  success: boolean;
  restaurantId?: string;
  tablesCount?: number;
  productsCount?: number;
  categoriesCount?: number;
  error?: string;
  step?: string;
}

/**
 * Publishes the complete restaurant setup to Supabase cloud tables:
 * 1. restaurants
 * 2. categories
 * 3. products
 * 4. restaurant_tables
 */
export async function publishToSupabase(
  profile: RestaurantProfile,
  tables: RestaurantTable[],
  ownerUser: User,
  onProgress?: (statusText: string, stepNum: number) => void
): Promise<PublishResult> {
  try {
    onProgress?.("Validating owner authorization & credentials...", 1);

    if (!ownerUser || !ownerUser.id) {
      return {
        success: false,
        error: "You must be authenticated with Supabase to publish your restaurant.",
        step: "auth",
      };
    }

    onProgress?.("Writing restaurant profile & branding to Supabase...", 2);

    // 1. Check if restaurant with this slug already exists for this owner
    let restaurantId: string = generateUUID();

    const { data: existingRest, error: checkErr } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", ownerUser.id)
      .eq("slug", profile.slug || "restaurant")
      .maybeSingle();

    if (checkErr && !checkErr.message.includes("multiple rows")) {
      console.warn("Could not check existing restaurant, creating fresh entry:", checkErr.message);
    }

    if (existingRest?.id) {
      restaurantId = existingRest.id;
      // Update restaurant
      const { error: updateErr } = await supabase
        .from("restaurants")
        .update({
          name: profile.name || "My Restaurant",
          slug: profile.slug || "restaurant",
          business_type: profile.businessType || "specialty_coffee",
          currency: profile.currency || "USD",
          logo_url: profile.logoUrl || null,
          primary_color: profile.branding?.primaryColor || "#D97706",
          cover_image: profile.branding?.coverImage || null,
          tagline: profile.branding?.tagline || null,
          menu_layout_theme: profile.branding?.menuLayoutTheme || "minimal",
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);

      if (updateErr) {
        throw new Error(`Failed to update restaurant: ${updateErr.message}`);
      }
    } else {
      // Insert new restaurant
      const { error: insertErr } = await supabase
        .from("restaurants")
        .insert({
          id: restaurantId,
          owner_id: ownerUser.id,
          name: profile.name || "My Restaurant",
          slug: profile.slug || "restaurant",
          business_type: profile.businessType || "specialty_coffee",
          currency: profile.currency || "USD",
          logo_url: profile.logoUrl || null,
          primary_color: profile.branding?.primaryColor || "#D97706",
          cover_image: profile.branding?.coverImage || null,
          tagline: profile.branding?.tagline || null,
          menu_layout_theme: profile.branding?.menuLayoutTheme || "minimal",
          is_published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertErr) {
        throw new Error(`Failed to create restaurant: ${insertErr.message}`);
      }
    }

    onProgress?.("Writing menu categories to Supabase...", 3);

    // Clean up previous categories, products, and tables for clean sync if updating
    if (existingRest?.id) {
      await supabase.from("products").delete().eq("restaurant_id", restaurantId);
      await supabase.from("restaurant_tables").delete().eq("restaurant_id", restaurantId);
      await supabase.from("categories").delete().eq("restaurant_id", restaurantId);
    }

    // 2. Insert categories (map IDs to valid UUIDs to satisfy Postgres UUID type)
    const categoryIdMap: Record<string, string> = {};
    const categoriesToInsert = profile.categories.map((cat, idx) => {
      const validUuid = isValidUUID(cat.id) ? cat.id : generateUUID();
      categoryIdMap[cat.id] = validUuid;

      return {
        id: validUuid,
        restaurant_id: restaurantId,
        name: cat.name,
        sort_order: cat.sortOrder || idx + 1,
        created_at: new Date().toISOString(),
      };
    });

    if (categoriesToInsert.length > 0) {
      const { error: catErr } = await supabase.from("categories").insert(categoriesToInsert);
      if (catErr) {
        throw new Error(`Failed to insert categories: ${catErr.message}`);
      }
    }

    onProgress?.("Writing products and menu dishes to Supabase...", 4);

    // 3. Insert products
    const productsToInsert = profile.products.map((prod) => {
      const validProdId = isValidUUID(prod.id) ? prod.id : generateUUID();
      const mappedCatId = categoryIdMap[prod.categoryId] || null;

      return {
        id: validProdId,
        restaurant_id: restaurantId,
        category_id: mappedCatId,
        name: prod.name,
        description: prod.description || null,
        price: Number(prod.price) || 0,
        image_url: prod.imageUrl || null,
        image_source: "uploaded",
        tags: prod.tags || [],
        is_available: prod.isAvailable ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    if (productsToInsert.length > 0) {
      const { error: prodErr } = await supabase.from("products").insert(productsToInsert);
      if (prodErr) {
        throw new Error(`Failed to insert products: ${prodErr.message}`);
      }
    }

    onProgress?.(`Provisioning ${tables.length} dining tables & QR codes...`, 5);

    // 4. Insert restaurant_tables matching { id, restaurant_id, table_number, qr_token, created_at }
    const tablesToInsert = tables.map((tbl) => {
      const validTableId = isValidUUID(tbl.id) ? tbl.id : generateUUID();

      return {
        id: validTableId,
        restaurant_id: restaurantId,
        table_number: Number(tbl.table_number),
        qr_token: tbl.qr_token,
        created_at: new Date().toISOString(),
      };
    });

    if (tablesToInsert.length > 0) {
      const { error: tblErr } = await supabase.from("restaurant_tables").insert(tablesToInsert);
      if (tblErr) {
        throw new Error(`Failed to insert restaurant tables: ${tblErr.message}`);
      }
    }

    onProgress?.("Publication complete! Live on Supabase.", 6);

    return {
      success: true,
      restaurantId,
      tablesCount: tablesToInsert.length,
      productsCount: productsToInsert.length,
      categoriesCount: categoriesToInsert.length,
    };
  } catch (err: any) {
    console.error("Supabase publish error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred during publish.",
    };
  }
}
