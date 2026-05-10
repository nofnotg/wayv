import type {
  BetaAccessAuditLog,
  BetaAccessRequest,
  BetaAccessStatus
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  betaAccessDecisionSchema,
  betaAccessListQuerySchema,
  betaApplicationSchema
} from "@/lib/validation/schemas";
import {
  evaluateContentGuardrail,
  recordContentGuardrailFlag
} from "@/lib/services/content-guardrail-service";
import {
  grantBetaSwimEntitlement,
  revokeBetaEntitlementForUser
} from "@/lib/services/entitlement-service";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapBetaAccessRow(row: Record<string, unknown>): BetaAccessRequest {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    email: String(row.email),
    applicantName: (row.applicant_name as string | null) ?? null,
    applicationNote: (row.application_note as string | null) ?? null,
    status: row.status as BetaAccessStatus,
    appliedAt: String(row.applied_at),
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    reviewedByUserId: (row.reviewed_by_user_id as string | null) ?? null,
    reviewNote: (row.review_note as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapBetaAuditRow(row: Record<string, unknown>): BetaAccessAuditLog {
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    userId: (row.user_id as string | null) ?? null,
    email: String(row.email),
    actorUserId: (row.actor_user_id as string | null) ?? null,
    actorLabel: String(row.actor_label),
    previousStatus: (row.previous_status as BetaAccessStatus | null) ?? null,
    nextStatus: row.next_status as BetaAccessStatus,
    note: (row.note as string | null) ?? null,
    createdAt: String(row.created_at)
  };
}

async function insertBetaAccessAuditLog(input: {
  requestId: string;
  userId?: string | null;
  email: string;
  actorUserId?: string | null;
  actorLabel: string;
  previousStatus: BetaAccessStatus | null;
  nextStatus: BetaAccessStatus;
  note?: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("beta_access_audit_logs")
    .insert({
      request_id: input.requestId,
      user_id: input.userId ?? null,
      email: input.email,
      actor_user_id: input.actorUserId ?? null,
      actor_label: input.actorLabel,
      previous_status: input.previousStatus,
      next_status: input.nextStatus,
      note: input.note ?? null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "beta-access-audit-log-failed");
  }

  return mapBetaAuditRow(data as Record<string, unknown>);
}

async function getRequestByUserId(userId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("beta_access_requests")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapBetaAccessRow(data as Record<string, unknown>) : null;
}

async function getRequestByEmail(email: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("beta_access_requests")
    .select("*")
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapBetaAccessRow(data as Record<string, unknown>) : null;
}

async function updateRequestRecord(
  requestId: string,
  patch: Record<string, unknown>
) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("beta_access_requests")
    .update(patch)
    .eq("id", requestId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "beta-access-update-failed");
  }

  return mapBetaAccessRow(data as Record<string, unknown>);
}

export async function getViewerBetaAccess(input: {
  userId: string;
  email: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const existingByUserId = await getRequestByUserId(input.userId);
  if (existingByUserId) {
    if (existingByUserId.email !== normalizedEmail) {
      return updateRequestRecord(existingByUserId.id, { email: normalizedEmail });
    }

    return existingByUserId;
  }

  const existingByEmail = await getRequestByEmail(normalizedEmail);
  if (existingByEmail) {
    if (existingByEmail.userId === input.userId) {
      return existingByEmail;
    }

    return updateRequestRecord(existingByEmail.id, { user_id: input.userId });
  }

  return null;
}

export async function submitBetaApplication(input: {
  email: string;
  applicantName?: string | null;
  applicationNote: string;
  userId?: string | null;
}) {
  const parsed = betaApplicationSchema.parse(input);
  const normalizedEmail = normalizeEmail(parsed.email);
  const userId = input.userId ?? null;
  const guardrail = evaluateContentGuardrail({
    targetType: "beta_application_note",
    text: parsed.applicationNote,
    userId
  });

  if (guardrail.action === "hard_block") {
    await recordContentGuardrailFlag({
      targetType: guardrail.targetType,
      userId,
      action: guardrail.action,
      reasons: guardrail.reasons,
      matchedTerms: guardrail.matchedTerms,
      contentExcerpt: guardrail.contentExcerpt,
      originalText: parsed.applicationNote,
      severity: guardrail.severity,
      suggestedAction: guardrail.suggestedAction ?? guardrail.action,
      guidanceFamily: guardrail.guidance?.family ?? null
    });
    throw new Error(JSON.stringify({ error: "content-hard-block", moderation: guardrail }));
  }

  const existing = userId
    ? (await getRequestByUserId(userId)) ?? (await getRequestByEmail(normalizedEmail))
    : await getRequestByEmail(normalizedEmail);

  if (!existing) {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("beta_access_requests")
      .insert({
        user_id: input.userId ?? null,
        email: normalizedEmail,
        applicant_name: parsed.applicantName ?? null,
        application_note: parsed.applicationNote,
        status: "pending"
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "beta-application-submit-failed");
    }

    const request = mapBetaAccessRow(data as Record<string, unknown>);
    const audit = await insertBetaAccessAuditLog({
      requestId: request.id,
      userId: request.userId,
      email: request.email,
      actorUserId: input.userId ?? null,
      actorLabel: input.userId ? "beta-application:user" : "beta-application:guest",
      previousStatus: null,
      nextStatus: "pending",
      note: parsed.applicationNote
    });

    if (guardrail.action !== "allow") {
      await recordContentGuardrailFlag({
        targetType: guardrail.targetType,
        targetId: request.id,
        userId: request.userId,
        action: guardrail.action,
        reasons: guardrail.reasons,
        matchedTerms: guardrail.matchedTerms,
        contentExcerpt: guardrail.contentExcerpt,
        originalText: parsed.applicationNote,
        severity: guardrail.severity,
        suggestedAction: guardrail.suggestedAction ?? guardrail.action,
        guidanceFamily: guardrail.guidance?.family ?? null
      });
    }

    return { request, audit, moderation: guardrail };
  }

  const nextStatus: BetaAccessStatus =
    existing.status === "approved" ? "approved" : "pending";

  const request = await updateRequestRecord(existing.id, {
    user_id: input.userId ?? existing.userId,
    email: normalizedEmail,
    applicant_name: parsed.applicantName ?? existing.applicantName,
    application_note: parsed.applicationNote,
    status: nextStatus,
    reviewed_at: nextStatus === "approved" ? existing.reviewedAt : null,
    reviewed_by_user_id: nextStatus === "approved" ? existing.reviewedByUserId : null,
    review_note: nextStatus === "approved" ? existing.reviewNote : null
  });

  const audit =
    existing.status !== nextStatus
      ? await insertBetaAccessAuditLog({
          requestId: request.id,
          userId: request.userId,
          email: request.email,
          actorUserId: input.userId ?? null,
          actorLabel: input.userId ? "beta-application:user" : "beta-application:guest",
          previousStatus: existing.status,
          nextStatus,
          note: parsed.applicationNote
        })
      : null;

  if (guardrail.action !== "allow") {
    await recordContentGuardrailFlag({
      targetType: guardrail.targetType,
      targetId: request.id,
      userId: request.userId,
      action: guardrail.action,
      reasons: guardrail.reasons,
      matchedTerms: guardrail.matchedTerms,
      contentExcerpt: guardrail.contentExcerpt,
      originalText: parsed.applicationNote,
      severity: guardrail.severity,
      suggestedAction: guardrail.suggestedAction ?? guardrail.action,
      guidanceFamily: guardrail.guidance?.family ?? null
    });
  }

  return { request, audit, moderation: guardrail };
}

export async function listBetaAccessRequests(input?: {
  status?: BetaAccessStatus | null;
  limit?: number;
}) {
  const parsed = betaAccessListQuerySchema.parse({
    status: input?.status ?? null,
    limit: input?.limit ?? 20
  });
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("beta_access_requests")
    .select("*")
    .order("applied_at", { ascending: false })
    .limit(parsed.limit);

  if (parsed.status) {
    query = query.eq("status", parsed.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapBetaAccessRow(row as Record<string, unknown>));
}

export async function listRecentBetaAccessAuditLogs(limit = 20) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("beta_access_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapBetaAuditRow(row as Record<string, unknown>));
}

export async function updateBetaAccessRequestStatus(input: {
  requestId: string;
  status: "approved" | "rejected" | "revoked";
  actorUserId?: string | null;
  actorLabel: string;
  note?: string | null;
}) {
  const parsed = betaAccessDecisionSchema.parse({
    status: input.status,
    note: input.note ?? null
  });
  const supabase = createAdminSupabaseClient();
  const { data: existingRow, error: fetchError } = await supabase
    .from("beta_access_requests")
    .select("*")
    .eq("id", input.requestId)
    .single();

  if (fetchError || !existingRow) {
    throw new Error(fetchError?.message ?? "beta-access-request-not-found");
  }

  const existing = mapBetaAccessRow(existingRow as Record<string, unknown>);
  const reviewedAt = new Date().toISOString();
  const request = await updateRequestRecord(existing.id, {
    status: parsed.status,
    reviewed_at: reviewedAt,
    reviewed_by_user_id: input.actorUserId ?? null,
    review_note: parsed.note ?? null
  });

  const audit = await insertBetaAccessAuditLog({
    requestId: request.id,
    userId: request.userId,
    email: request.email,
    actorUserId: input.actorUserId ?? null,
    actorLabel: input.actorLabel,
    previousStatus: existing.status,
    nextStatus: parsed.status,
    note: parsed.note ?? null
  });

  if (request.userId && parsed.status === "approved") {
    await grantBetaSwimEntitlement({
      userId: request.userId,
      grantedByUserId: input.actorUserId ?? null
    });
  }

  if (request.userId && parsed.status === "revoked") {
    await revokeBetaEntitlementForUser({
      userId: request.userId,
      grantedByUserId: input.actorUserId ?? null
    });
  }

  return { request, audit };
}
