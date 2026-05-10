import type {
  EntitlementSource,
  EntitlementStatus,
  ProductPlan,
  UserEntitlement
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function mapEntitlementRow(row: Record<string, unknown>): UserEntitlement {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    planKey: row.plan_key as ProductPlan,
    source: row.source as EntitlementSource,
    status: row.status as EntitlementStatus,
    startsAt: String(row.starts_at),
    endsAt: (row.ends_at as string | null) ?? null,
    grantedByUserId: (row.granted_by_user_id as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export async function getActiveEntitlementForUser(userId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapEntitlementRow(data as Record<string, unknown>) : null;
}

export async function listActiveEntitlementsForUsers(userIds: string[]) {
  if (!userIds.length) {
    return [] as UserEntitlement[];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("*")
    .in("user_id", userIds)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapEntitlementRow(row as Record<string, unknown>));
}

export async function grantBetaSwimEntitlement(input: {
  userId: string;
  grantedByUserId?: string | null;
}) {
  const supabase = createAdminSupabaseClient();

  const existing = await getActiveEntitlementForUser(input.userId);
  if (existing?.planKey === "swim" && existing.source === "beta_operator_grant") {
    return existing;
  }

  if (existing) {
    const { error: revokeError } = await supabase
      .from("user_entitlements")
      .update({ status: "revoked", ends_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (revokeError) {
      throw new Error(revokeError.message);
    }
  }

  const { data, error } = await supabase
    .from("user_entitlements")
    .insert({
      user_id: input.userId,
      plan_key: "swim",
      source: "beta_operator_grant",
      status: "active",
      granted_by_user_id: input.grantedByUserId ?? null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "entitlement-grant-failed");
  }

  return mapEntitlementRow(data as Record<string, unknown>);
}

export async function revokeBetaEntitlementForUser(input: {
  userId: string;
  grantedByUserId?: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("user_entitlements")
    .update({
      status: "revoked",
      ends_at: new Date().toISOString(),
      granted_by_user_id: input.grantedByUserId ?? null
    })
    .eq("user_id", input.userId)
    .eq("source", "beta_operator_grant")
    .eq("status", "active")
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapEntitlementRow(row as Record<string, unknown>));
}
