import { randomUUID } from "crypto";

import type {
  NotificationChannel,
  NotificationDeliveryBatch,
  NotificationDeliveryOutcome,
  NotificationEvent,
  NotificationEventState
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

import {
  deliverableNotificationStates,
  isNotificationEventDeliverable,
  resolveNotificationEventState
} from "@/lib/services/notification-lifecycle-service";

type EventRow = {
  id: string;
  user_id: string;
  type: NotificationEvent["type"];
  channel: NotificationEvent["channel"];
  post_id: string | null;
  lane: NotificationEvent["lane"];
  title: string;
  body: string;
  state: NotificationEventState;
  suppression_reason: NotificationEvent["suppressionReason"];
  dedupe_key: string | null;
  created_at: string;
  claim_token: string | null;
  claimed_at: string | null;
  claim_expires_at: string | null;
  next_retry_at: string | null;
  last_attempt_at: string | null;
  last_error: string | null;
  attempt_count: number | null;
  sent_at: string | null;
  read_at: string | null;
};

function mapEventRow(row: EventRow): NotificationEvent {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: row.type,
    channel: row.channel,
    postId: row.post_id,
    lane: row.lane,
    title: row.title,
    body: row.body,
    state: row.state,
    suppressionReason: row.suppression_reason,
    dedupeKey: row.dedupe_key,
    createdAt: String(row.created_at),
    claimToken: row.claim_token,
    claimedAt: row.claimed_at,
    claimExpiresAt: row.claim_expires_at,
    nextRetryAt: row.next_retry_at,
    lastAttemptAt: row.last_attempt_at,
    lastError: row.last_error,
    attemptCount: row.attempt_count ?? 0,
    sentAt: row.sent_at,
    readAt: row.read_at
  };
}

function buildClaimAvailabilityFilter(nowIso: string) {
  return `claim_token.is.null,claim_expires_at.lt.${nowIso}`;
}

function sanitizeLimit(limit?: number) {
  return Math.max(1, Math.min(limit ?? 50, 100));
}

function sanitizeRetryAfterMinutes(value?: number) {
  return Math.max(1, Math.min(value ?? 15, 24 * 60));
}

export async function listNotificationDeliveryEvents(input?: {
  limit?: number;
  userId?: string;
  channel?: NotificationChannel;
  states?: NotificationEventState[];
}) {
  const supabase = createAdminSupabaseClient();
  const safeLimit = sanitizeLimit(input?.limit);

  let query = supabase
    .from("notification_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (input?.userId) {
    query = query.eq("user_id", input.userId);
  }

  if (input?.channel) {
    query = query.eq("channel", input.channel);
  }

  if (input?.states?.length) {
    query = query.in("state", input.states);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapEventRow(row as EventRow));
}

export async function listDeliverableNotificationEvents(input?: {
  limit?: number;
  userId?: string;
  channel?: NotificationChannel;
}) {
  const now = new Date();
  const nowIso = now.toISOString();
  const supabase = createAdminSupabaseClient();
  const safeLimit = sanitizeLimit(input?.limit);

  let query = supabase
    .from("notification_events")
    .select("*")
    .in("state", deliverableNotificationStates)
    .is("read_at", null)
    .or(buildClaimAvailabilityFilter(nowIso))
    .order("created_at", { ascending: true })
    .limit(safeLimit);

  if (input?.userId) {
    query = query.eq("user_id", input.userId);
  }

  if (input?.channel) {
    query = query.eq("channel", input.channel);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => mapEventRow(row as EventRow))
    .filter((event) => isNotificationEventDeliverable(event, now));
}

export async function claimDeliverableNotificationBatch(input?: {
  limit?: number;
  userId?: string;
  channel?: NotificationChannel;
  claimTtlMinutes?: number;
}): Promise<NotificationDeliveryBatch> {
  const now = new Date();
  const nowIso = now.toISOString();
  const claimToken = randomUUID();
  const claimTtlMinutes = Math.max(1, Math.min(input?.claimTtlMinutes ?? 10, 60));
  const claimExpiresAt = new Date(now.getTime() + claimTtlMinutes * 60_000).toISOString();
  const candidates = await listDeliverableNotificationEvents({
    limit: input?.limit,
    userId: input?.userId,
    channel: input?.channel
  });

  if (!candidates.length) {
    return {
      claimToken,
      claimedAt: nowIso,
      claimExpiresAt,
      events: []
    };
  }

  const candidateIds = candidates.map((event) => event.id);
  const supabase = createAdminSupabaseClient();
  let update = supabase
    .from("notification_events")
    .update({
      claim_token: claimToken,
      claimed_at: nowIso,
      claim_expires_at: claimExpiresAt
    })
    .in("id", candidateIds)
    .in("state", deliverableNotificationStates)
    .is("read_at", null)
    .or(buildClaimAvailabilityFilter(nowIso));

  if (input?.userId) {
    update = update.eq("user_id", input.userId);
  }

  if (input?.channel) {
    update = update.eq("channel", input.channel);
  }

  const { data, error } = await update.select("*");
  if (error) {
    throw new Error(error.message);
  }

  return {
    claimToken,
    claimedAt: nowIso,
    claimExpiresAt,
    events: (data ?? []).map((row) => mapEventRow(row as EventRow))
  };
}

async function updateDeliveryOutcome(input: {
  eventIds: string[];
  claimToken?: string;
  outcome: NotificationDeliveryOutcome;
  retryAfterMinutes?: number;
  lastError?: string;
}) {
  const uniqueIds = [...new Set(input.eventIds.filter(Boolean))];
  if (!uniqueIds.length) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data: current, error: currentError } = await supabase
    .from("notification_events")
    .select("*")
    .in("id", uniqueIds);

  if (currentError) {
    throw new Error(currentError.message);
  }

  const retryAfterMinutes = sanitizeRetryAfterMinutes(input.retryAfterMinutes);
  const now = new Date();
  const nowIso = now.toISOString();

  const eligible = (current ?? [])
    .map((row) => row as EventRow)
    .filter((row) => {
      if (input.claimToken && row.claim_token !== input.claimToken) {
        return false;
      }

      return (
        row.state === "pending" ||
        row.state === "operational_only" ||
        row.state === "retryable"
      );
    });

  const updated: NotificationEvent[] = [];

  for (const row of eligible) {
    const nextState =
      input.outcome === "sent"
        ? resolveNotificationEventState(row.state, "mark_sent")
        : input.outcome === "failed"
          ? resolveNotificationEventState(row.state, "mark_failed")
          : resolveNotificationEventState(row.state, "mark_retryable");

    const patch: Record<string, unknown> = {
      state: nextState,
      claim_token: null,
      claimed_at: null,
      claim_expires_at: null,
      last_attempt_at: nowIso,
      attempt_count: (row.attempt_count ?? 0) + 1
    };

    if (input.outcome === "sent") {
      patch.sent_at = nowIso;
      patch.last_error = null;
      patch.next_retry_at = null;
    } else if (input.outcome === "failed") {
      patch.last_error = input.lastError ?? "delivery-failed";
      patch.next_retry_at = null;
    } else {
      patch.last_error = input.lastError ?? "delivery-retryable";
      patch.next_retry_at = new Date(now.getTime() + retryAfterMinutes * 60_000).toISOString();
    }

    const { data, error } = await supabase
      .from("notification_events")
      .update(patch)
      .eq("id", row.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "notification-delivery-outcome-failed");
    }

    updated.push(mapEventRow(data as EventRow));
  }

  return updated;
}

export async function markNotificationBatchSent(input: {
  eventIds: string[];
  claimToken?: string;
}) {
  return updateDeliveryOutcome({
    eventIds: input.eventIds,
    claimToken: input.claimToken,
    outcome: "sent"
  });
}

export async function markNotificationBatchFailed(input: {
  eventIds: string[];
  claimToken?: string;
  lastError?: string;
}) {
  return updateDeliveryOutcome({
    eventIds: input.eventIds,
    claimToken: input.claimToken,
    outcome: "failed",
    lastError: input.lastError
  });
}

export async function markNotificationBatchRetryable(input: {
  eventIds: string[];
  claimToken?: string;
  retryAfterMinutes?: number;
  lastError?: string;
}) {
  return updateDeliveryOutcome({
    eventIds: input.eventIds,
    claimToken: input.claimToken,
    outcome: "retryable",
    retryAfterMinutes: input.retryAfterMinutes,
    lastError: input.lastError
  });
}
