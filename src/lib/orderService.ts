import { supabase } from "./supabase";
import { Order, OrderItem, OrderStatus, Product, Category, RestaurantTable } from "../types";

export interface CustomerMenuResolvedData {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    business_type?: string;
    logo_url?: string | null;
    cover_image?: string | null;
    primary_color: string;
    tagline?: string | null;
    menu_layout_theme?: string;
  };
  table: {
    id: string;
    restaurant_id: string;
    table_number: number;
    qr_token: string;
  };
  categories: Category[];
  products: Product[];
}

/**
 * Resolves a customer table QR token and loads the published restaurant menu
 */
export async function resolveCustomerMenu(
  slug: string,
  qr_token: string
): Promise<{ data: CustomerMenuResolvedData | null; error: string | null }> {
  try {
    // 1. Resolve qr_token to a restaurant_tables row via Supabase select
    const { data: tableRow, error: tableErr } = await supabase
      .from("restaurant_tables")
      .select("id, restaurant_id, table_number, qr_token")
      .eq("qr_token", qr_token)
      .maybeSingle();

    if (tableErr) {
      console.warn("Table lookup error:", tableErr.message);
    }

    let resolvedTable = tableRow;
    let restaurantId = tableRow?.restaurant_id;

    // If table wasn't found directly by qr_token or table has no restaurant_id,
    // check if we can find restaurant by slug
    if (!resolvedTable || !restaurantId) {
      const { data: restBySlug } = await supabase
        .from("restaurants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (restBySlug?.id) {
        restaurantId = restBySlug.id;
        // Try finding table in this restaurant
        const { data: fallbackTable } = await supabase
          .from("restaurant_tables")
          .select("id, restaurant_id, table_number, qr_token")
          .eq("restaurant_id", restBySlug.id)
          .eq("qr_token", qr_token)
          .maybeSingle();

        if (fallbackTable) {
          resolvedTable = fallbackTable;
        } else {
          // If token not matched but restaurant exists, fallback to Table 1 for testing
          const { data: firstTable } = await supabase
            .from("restaurant_tables")
            .select("id, restaurant_id, table_number, qr_token")
            .eq("restaurant_id", restBySlug.id)
            .order("table_number", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (firstTable) resolvedTable = firstTable;
        }
      }
    }

    if (!restaurantId || !resolvedTable) {
      return {
        data: null,
        error: `Could not find an active table or published restaurant for token "${qr_token}" on "${slug}".`,
      };
    }

    // 2. Load published restaurant details
    const { data: restaurant, error: restErr } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .single();

    if (restErr || !restaurant) {
      return {
        data: null,
        error: restErr?.message || "Restaurant profile could not be loaded from database.",
      };
    }

    // 3. Load published categories
    const { data: categoriesData, error: catErr } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true });

    if (catErr) {
      console.warn("Error fetching categories:", catErr.message);
    }

    // 4. Load available products
    const { data: productsData, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true);

    if (prodErr) {
      console.warn("Error fetching products:", prodErr.message);
    }

    const categories: Category[] = (categoriesData || []).map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order || 0,
      description: c.description,
    }));

    const products: Product[] = (productsData || []).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      categoryId: p.category_id,
      description: p.description || "",
      imageUrl: p.image_url || undefined,
      tags: p.tags || [],
      isAvailable: p.is_available ?? true,
    }));

    return {
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          currency: restaurant.currency || "USD",
          business_type: restaurant.business_type,
          logo_url: restaurant.logo_url,
          cover_image: restaurant.cover_image,
          primary_color: restaurant.primary_color || "#D97706",
          tagline: restaurant.tagline,
          menu_layout_theme: restaurant.menu_layout_theme || "minimal",
        },
        table: {
          id: resolvedTable.id,
          restaurant_id: resolvedTable.restaurant_id,
          table_number: resolvedTable.table_number,
          qr_token: resolvedTable.qr_token,
        },
        categories,
        products,
      },
      error: null,
    };
  } catch (err: any) {
    console.error("resolveCustomerMenu error:", err);
    return { data: null, error: err?.message || "Failed to load customer menu." };
  }
}

export interface SubmitOrderPayload {
  restaurant_id: string;
  table_id: string;
  items: {
    product_id: string;
    product_name_snapshot: string;
    quantity: number;
  }[];
}

export interface SubmitOrderResult {
  success: boolean;
  orderId?: string;
  daily_order_number?: number | string;
  total?: number;
  error?: string;
}

/**
 * Submits a customer order:
 * 1. Inserts into orders (restaurant_id, table_id, status: "pending", total: 0)
 * 2. Inserts into order_items (product_id, product_name_snapshot, quantity — no price_snapshot)
 * 3. Returns order with daily_order_number & calculated total
 */
export async function submitCustomerOrder(
  payload: SubmitOrderPayload
): Promise<SubmitOrderResult> {
  try {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Cannot submit an empty order." };
    }

    // Step 1: insert one row into orders (restaurant_id, table_id, status: "pending", total: 0 — trigger will fix it)
    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .insert({
        restaurant_id: payload.restaurant_id,
        table_id: payload.table_id,
        status: "pending",
        total: 0,
      })
      .select()
      .single();

    if (orderErr || !orderRow) {
      throw new Error(`Failed to place order: ${orderErr?.message || "Database insert failed"}`);
    }

    const orderId = orderRow.id;

    // Step 2: insert matching rows into order_items (product_id, product_name_snapshot, quantity — do not send price_snapshot, trigger fills it)
    const itemsToInsert = payload.items.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name_snapshot: item.product_name_snapshot,
      quantity: item.quantity,
    }));

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsErr) {
      throw new Error(`Failed to record order items: ${itemsErr.message}`);
    }

    // Step 3: Fetch updated order to get the final daily_order_number and total computed by trigger
    const { data: updatedOrder, error: fetchErr } = await supabase
      .from("orders")
      .select("id, daily_order_number, total, status")
      .eq("id", orderId)
      .single();

    const finalOrderNumber = updatedOrder?.daily_order_number ?? orderRow.daily_order_number ?? 1;
    const finalTotal = updatedOrder?.total ?? 0;

    return {
      success: true,
      orderId,
      daily_order_number: finalOrderNumber,
      total: finalTotal,
    };
  } catch (err: any) {
    console.error("submitCustomerOrder error:", err);
    return {
      success: false,
      error: err?.message || "Failed to submit your order. Please try again.",
    };
  }
}

/**
 * Worker Dashboard: Fetch all orders for a restaurant with table and items joined
 */
export async function fetchRestaurantOrders(restaurantId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        restaurant_id,
        table_id,
        status,
        total,
        daily_order_number,
        created_at,
        updated_at,
        restaurant_tables ( id, table_number, qr_token ),
        order_items ( id, product_id, product_name_snapshot, quantity, price_snapshot )
      `)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error.message);
      return [];
    }

    return (data || []).map((row: any) => {
      // Map joined table_number safely whether joined as single object or array
      const rawTable: any = Array.isArray(row.restaurant_tables)
        ? row.restaurant_tables[0]
        : row.restaurant_tables;

      const tableNumber =
        rawTable?.table_number != null
          ? Number(rawTable.table_number)
          : row.table_number != null
          ? Number(row.table_number)
          : 1;

      return {
        id: row.id,
        restaurant_id: row.restaurant_id,
        table_id: row.table_id,
        status: row.status as OrderStatus,
        total: Number(row.total) || 0,
        daily_order_number: row.daily_order_number,
        created_at: row.created_at,
        updated_at: row.updated_at,
        table_number: tableNumber,
        restaurant_tables: rawTable
          ? {
              id: String(rawTable.id),
              table_number: Number(rawTable.table_number),
              qr_token: rawTable.qr_token,
            }
          : undefined,
        order_items: (row.order_items || []).map((it: any) => ({
          id: it.id,
          product_id: it.product_id,
          product_name_snapshot: it.product_name_snapshot,
          quantity: Number(it.quantity) || 1,
          price_snapshot: it.price_snapshot != null ? Number(it.price_snapshot) : undefined,
        })),
      };
    });
  } catch (err) {
    console.error("fetchRestaurantOrders error:", err);
    return [];
  }
}

/**
 * Worker Dashboard: Update an order's status
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update status." };
  }
}

/**
 * Helper to fetch full details for a single order (used when real-time payload arrives)
 */
export async function fetchSingleOrderWithDetails(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        restaurant_id,
        table_id,
        status,
        total,
        daily_order_number,
        created_at,
        updated_at,
        restaurant_tables ( id, table_number, qr_token ),
        order_items ( id, product_id, product_name_snapshot, quantity, price_snapshot )
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) return null;

    const rawTable: any = Array.isArray((data as any).restaurant_tables)
      ? (data as any).restaurant_tables[0]
      : (data as any).restaurant_tables;

    const tableNumber =
      rawTable?.table_number != null
        ? Number(rawTable.table_number)
        : (data as any).table_number != null
        ? Number((data as any).table_number)
        : 1;

    return {
      id: data.id,
      restaurant_id: data.restaurant_id,
      table_id: data.table_id,
      status: data.status as OrderStatus,
      total: Number(data.total) || 0,
      daily_order_number: data.daily_order_number,
      created_at: data.created_at,
      updated_at: data.updated_at,
      table_number: tableNumber,
      restaurant_tables: rawTable
        ? {
            id: String(rawTable.id),
            table_number: Number(rawTable.table_number),
            qr_token: rawTable.qr_token,
          }
        : undefined,
      order_items: (data.order_items || []).map((it: any) => ({
        id: it.id,
        product_id: it.product_id,
        product_name_snapshot: it.product_name_snapshot,
        quantity: Number(it.quantity) || 1,
        price_snapshot: it.price_snapshot != null ? Number(it.price_snapshot) : undefined,
      })),
    };
  } catch {
    return null;
  }
}
