import { supabase } from "./supabase";
import { WorkerInvite, WorkerRole } from "../types";

/**
 * Generate a random 12-character alphanumeric invite token
 */
export function generateInviteToken(length = 12): string {
  // Using unambiguous uppercase alphanumeric characters
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    token += charset[randomIndex];
  }
  return token;
}

/**
 * Insert a new worker invite into Supabase
 * Expires in 24 hours from creation
 */
export async function createWorkerInvite(
  restaurantId: string,
  role: WorkerRole
): Promise<{ invite: WorkerInvite | null; error: string | null }> {
  try {
    const inviteToken = generateInviteToken(12);
    // Explicit 24-hour expiration window
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("worker_invites")
      .insert({
        restaurant_id: restaurantId,
        invite_token: inviteToken,
        role,
        is_used: false,
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating worker invite:", error);
      return { invite: null, error: error.message };
    }

    return {
      invite: data as WorkerInvite,
      error: null,
    };
  } catch (err: any) {
    console.error("Unexpected error creating worker invite:", err);
    return { invite: null, error: err.message || "Failed to create worker invite" };
  }
}

/**
 * Fetch all worker invites for a restaurant with status and user details
 */
export async function fetchWorkerInvites(restaurantId: string): Promise<WorkerInvite[]> {
  try {
    const { data, error } = await supabase
      .from("worker_invites")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching worker invites:", error);
      return [];
    }

    const invites = data as WorkerInvite[];

    // For used invites, look up user identifiers from workers table or auth
    const usedByIds = invites
      .filter((inv) => inv.is_used && inv.used_by)
      .map((inv) => inv.used_by as string);

    if (usedByIds.length > 0) {
      try {
        const { data: workersData } = await supabase
          .from("workers")
          .select("id, full_name, role")
          .in("id", usedByIds);

        const workerMap = new Map<string, { full_name?: string }>();
        if (workersData) {
          for (const w of workersData) {
            workerMap.set(w.id, { full_name: w.full_name });
          }
        }

        // Try getting auth email details if available
        let userEmailMap = new Map<string, string>();
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          if (authUsers?.users) {
            for (const u of authUsers.users) {
              if (u.email) {
                userEmailMap.set(u.id, u.email);
              }
            }
          }
        } catch {
          // Non-blocking fallback
        }

        for (const inv of invites) {
          if (inv.used_by) {
            const wInfo = workerMap.get(inv.used_by);
            const email = userEmailMap.get(inv.used_by);
            inv.used_by_name = wInfo?.full_name || undefined;
            inv.used_by_email = email || undefined;
          }
        }
      } catch (err) {
        console.warn("Could not enrich used_by worker details:", err);
      }
    }

    return invites;
  } catch (err) {
    console.error("Unexpected error in fetchWorkerInvites:", err);
    return [];
  }
}

/**
 * Revoke (delete) an unused worker invite
 */
export async function revokeWorkerInvite(
  inviteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("worker_invites")
      .delete()
      .eq("id", inviteId)
      .eq("is_used", false);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to revoke invite" };
  }
}

/**
 * Check details for a specific invite token (for display on /join/:token)
 */
export async function fetchInviteTokenDetails(inviteToken: string): Promise<{
  invite: WorkerInvite | null;
  restaurantName?: string;
  isExpired: boolean;
  isUsed: boolean;
  error?: string;
}> {
  try {
    const { data: invite, error } = await supabase
      .from("worker_invites")
      .select("*")
      .eq("invite_token", inviteToken.trim())
      .maybeSingle();

    if (error || !invite) {
      return {
        invite: null,
        isExpired: false,
        isUsed: false,
        error: "Invite not found",
      };
    }

    const isExpired = new Date(invite.expires_at).getTime() <= Date.now();
    const isUsed = Boolean(invite.is_used);

    let restaurantName = "Restaurant";
    if (invite.restaurant_id) {
      const { data: rest } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", invite.restaurant_id)
        .maybeSingle();
      if (rest?.name) {
        restaurantName = rest.name;
      }
    }

    return {
      invite: invite as WorkerInvite,
      restaurantName,
      isExpired,
      isUsed,
    };
  } catch (err: any) {
    return {
      invite: null,
      isExpired: false,
      isUsed: false,
      error: err.message || "Failed to query invite",
    };
  }
}

/**
 * Redeem worker invite using Postgres RPC function: redeem_worker_invite(p_invite_token)
 */
export async function redeemWorkerInvite(inviteToken: string): Promise<{
  success: boolean;
  restaurantId?: string;
  role?: string;
  error?: string;
}> {
  try {
    const cleanToken = inviteToken.trim();
    // Call Supabase RPC with p_invite_token
    const { data, error } = await supabase.rpc("redeem_worker_invite", {
      p_invite_token: cleanToken,
    });

    if (error) {
      console.warn("RPC redeem_worker_invite error, attempting direct table redemption fallback:", error);
      try {
        const { data: invite, error: fetchErr } = await supabase
          .from("worker_invites")
          .select("*")
          .eq("invite_token", cleanToken)
          .maybeSingle();

        if (fetchErr || !invite || invite.is_used || new Date(invite.expires_at).getTime() <= Date.now()) {
          return {
            success: false,
            error: "This invite is no longer valid — ask your manager for a new QR code.",
          };
        }

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        const { error: updateErr } = await supabase
          .from("worker_invites")
          .update({
            is_used: true,
            used_by: userId || null,
            used_at: new Date().toISOString(),
          })
          .eq("id", invite.id)
          .eq("is_used", false);

        if (updateErr) {
          return {
            success: false,
            error: "This invite is no longer valid — ask your manager for a new QR code.",
          };
        }

        if (userId && invite.restaurant_id) {
          try {
            await supabase.from("workers").upsert({
              id: userId,
              restaurant_id: invite.restaurant_id,
              role: invite.role || "kitchen",
              full_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Worker",
            });
          } catch {
            // non-blocking
          }
        }

        return {
          success: true,
          restaurantId: String(invite.restaurant_id),
          role: invite.role ? String(invite.role) : undefined,
        };
      } catch (fallbackErr) {
        console.error("Direct fallback error:", fallbackErr);
        return {
          success: false,
          error: "This invite is no longer valid — ask your manager for a new QR code.",
        };
      }
    }

    // data format returned: [ { restaurant_id: '...', role: '...' } ] or object
    const resultRow = Array.isArray(data) ? data[0] : data;
    const restaurantId = resultRow?.restaurant_id || resultRow?.id;
    const role = resultRow?.role;

    if (!restaurantId) {
      return {
        success: false,
        error: "This invite is no longer valid — ask your manager for a new QR code.",
      };
    }

    return {
      success: true,
      restaurantId: String(restaurantId),
      role: role ? String(role) : undefined,
    };
  } catch (err: any) {
    console.error("redeemWorkerInvite catch:", err);
    return {
      success: false,
      error: "This invite is no longer valid — ask your manager for a new QR code.",
    };
  }
}

/**
 * Helper to determine invite status string
 */
export function getInviteStatus(invite: WorkerInvite): "Pending" | "Used" | "Expired" {
  if (invite.is_used) {
    return "Used";
  }
  const now = Date.now();
  const expires = new Date(invite.expires_at).getTime();
  if (now > expires) {
    return "Expired";
  }
  return "Pending";
}
