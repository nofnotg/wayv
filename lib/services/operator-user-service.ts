import type {
  BetaAccessRequest,
  OperatorUserListItem,
  UserEntitlement
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { listActiveEntitlementsForUsers } from "@/lib/services/entitlement-service";

function mapBetaAccessRow(row: Record<string, unknown>): BetaAccessRequest {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    email: String(row.email),
    applicantName: (row.applicant_name as string | null) ?? null,
    applicationNote: (row.application_note as string | null) ?? null,
    status: row.status as BetaAccessRequest["status"],
    appliedAt: String(row.applied_at),
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    reviewedByUserId: (row.reviewed_by_user_id as string | null) ?? null,
    reviewNote: (row.review_note as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export async function listOperatorUsers(limit = 40) {
  const supabase = createAdminSupabaseClient();
  const { data: profileRows, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, email, nickname, onboarding_completed_at, last_active_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profiles = (profileRows ?? []).map((row) => row as Record<string, unknown>);
  const userIds = profiles.map((row) => String(row.id));
  const emails = profiles.map((row) => String(row.email).toLowerCase());

  if (!profiles.length) {
    return [] as OperatorUserListItem[];
  }

  const [
    { data: requestRowsByUserId, error: requestByUserIdError },
    { data: requestRowsByEmail, error: requestByEmailError },
    { data: operatorRows, error: operatorError },
    entitlements
  ] = await Promise.all([
    supabase.from("beta_access_requests").select("*").in("user_id", userIds),
    supabase.from("beta_access_requests").select("*").in("email", emails),
    supabase.from("internal_operators").select("user_id, role, is_active").in("user_id", userIds),
    listActiveEntitlementsForUsers(userIds)
  ]);

  if (requestByUserIdError ?? requestByEmailError) {
    throw new Error((requestByUserIdError ?? requestByEmailError)?.message);
  }

  if (operatorError) {
    throw new Error(operatorError.message);
  }

  const requests = [...(requestRowsByUserId ?? []), ...(requestRowsByEmail ?? [])].map((row) =>
    mapBetaAccessRow(row as Record<string, unknown>)
  );
  const operators = (operatorRows ?? []).map((row) => row as Record<string, unknown>);
  const entitlementByUserId = new Map<string, UserEntitlement>(
    entitlements.map((entitlement) => [entitlement.userId, entitlement])
  );

  return profiles.map((profile) => {
    const userId = String(profile.id);
    const email = String(profile.email).toLowerCase();
    const betaRequest =
      requests.find((request) => request.userId === userId) ??
      requests.find((request) => request.email.toLowerCase() === email) ??
      null;
    const operator = operators.find(
      (row) => String(row.user_id) === userId && Boolean(row.is_active)
    );

    return {
      userId,
      email,
      nickname: (profile.nickname as string | null) ?? null,
      onboardingCompletedAt: (profile.onboarding_completed_at as string | null) ?? null,
      lastActiveAt: (profile.last_active_at as string | null) ?? null,
      betaRequest,
      operatorRole: operator ? (operator.role as "operator" | "admin") : null,
      entitlement: entitlementByUserId.get(userId) ?? null
    } satisfies OperatorUserListItem;
  });
}
