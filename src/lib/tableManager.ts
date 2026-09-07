import QRCode from "qrcode";
import { RestaurantTable } from "../types";
import { generateUUID } from "./supabase";

/**
 * Generate a random 8-character alphanumeric qr_token
 * e.g. "8K2P9Q1X"
 */
export function generateRandomQrToken(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // clear readable alphanumeric chars (excluding 0/O and 1/I)
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Ensures exactly `count` tables exist while preserving existing tokens where possible.
 * Strict shape matching Supabase restaurant_tables: { id, table_number, qr_token }
 */
export function syncTables(
  count: number,
  slug: string,
  existingTables: (RestaurantTable & { tableNumber?: number; token?: string })[] = []
): RestaurantTable[] {
  const safeCount = Math.max(1, Math.min(100, Math.floor(count) || 1));
  const result: RestaurantTable[] = [];

  for (let i = 1; i <= safeCount; i++) {
    const existing = existingTables.find(
      (t) => (t.table_number === i) || (t.tableNumber === i)
    );

    if (existing) {
      result.push({
        id: existing.id || generateUUID(),
        table_number: i,
        qr_token: existing.qr_token || existing.token || generateRandomQrToken(8),
      });
    } else {
      result.push({
        id: generateUUID(),
        table_number: i,
        qr_token: generateRandomQrToken(8),
      });
    }
  }

  return result;
}

/**
 * Returns the future public URL for a given restaurant slug and table token.
 * Format: https://{restaurantSlug}.menuos.app/menu/{qr_token}
 */
export function getTableFullUrl(slug: string, qr_token: string): string {
  const cleanSlug = slug?.trim() || "demo";
  return `https://${cleanSlug}.menuos.app/menu/${qr_token}`;
}

export function getTableRelativePath(slug: string, qr_token: string): string {
  return `/menu/${qr_token}`;
}

/**
 * Generates high-resolution QR code data URL asynchronously
 */
export async function generateQrDataUrl(contentUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(contentUrl, {
      width: 400,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR code data URL", err);
    return "";
  }
}

/**
 * Initiates browser download of single QR Code PNG
 */
export function downloadQrImage(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
