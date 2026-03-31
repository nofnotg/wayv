import type {
  NotificationDeliveryAttemptAggregates,
  NotificationDeliveryAttemptLog,
  NotificationDeliveryRunDetail,
  NotificationDeliveryRunRecord,
  NotificationExecutionRunResult
} from "@/lib/domain/types";
import { buildNotificationDeliveryAttemptAggregates } from "@/lib/services/notification-delivery-attempt-aggregation-service";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type AttemptLogRow = {
  id: string;
  run_id: string;
  claim_token: string;
  event_id: string;
  channel: NotificationDeliveryAttemptLog["channel"];
  adapter_key: string;
  provider_key: string | null;
  sender_mode: NotificationDeliveryAttemptLog["senderMode"] | null;
  external_message_id: string | null;
  retry_category: NotificationDeliveryAttemptLog["retryCategory"];
  provider_status_code: string | null;
  outcome: NotificationDeliveryAttemptLog["outcome"];
  message: string | null;
  created_at: string;
};

type RunRow = {
  id: string;
  claim_token: string;
  ran_at: string;
  requested_limit: number | null;
  claimed_count: number;
  sent_count: number;
  failed_count: number;
  retryable_count: number;
  guardrail_skipped_count: number;
  created_at: string;
};

type EventSnapshotRow = {
  id: string;
  state: NotificationDeliveryAttemptLog["currentEventState"];
  next_retry_at: string | null;
  attempt_count: number | null;
};

function mapRunRow(row: RunRow): NotificationDeliveryRunRecord {
  return {
    id: row.id,
    claimToken: row.claim_token,
    ranAt: row.ran_at ?? row.created_at,
    requestedLimit: row.requested_limit,
    claimedCount: row.claimed_count,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    retryableCount: row.retryable_count,
    guardrailSkippedCount: row.guardrail_skipped_count
  };
}

function mapAttemptRow(row: AttemptLogRow): NotificationDeliveryAttemptLog {
  return {
    id: row.id,
    runId: row.run_id,
    claimToken: row.claim_token,
    eventId: row.event_id,
    channel: row.channel,
    adapterKey: row.adapter_key,
    providerKey: row.provider_key ?? row.adapter_key,
    senderMode: row.sender_mode ?? "noop",
    externalMessageId: row.external_message_id,
    retryCategory: row.retry_category,
    providerStatusCode: row.provider_status_code,
    outcome: row.outcome,
    message: row.message,
    createdAt: row.created_at
  };
}

function applyEventSnapshot(
  attempt: NotificationDeliveryAttemptLog,
  snapshot: EventSnapshotRow | undefined
) {
  if (!snapshot) {
    return attempt;
  }

  return {
    ...attempt,
    currentEventState: snapshot.state ?? null,
    nextRetryAt: snapshot.next_retry_at,
    attemptCount: snapshot.attempt_count ?? undefined
  };
}

export async function recordNotificationDeliveryAttemptLogs(input: {
  runId: string;
  claimToken: string;
  attempts: NotificationExecutionRunResult[];
}) {
  if (!input.attempts.length) {
    return [] as NotificationDeliveryAttemptLog[];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notification_delivery_attempt_logs")
    .insert(
      input.attempts.map((attempt) => ({
        run_id: input.runId,
        claim_token: input.claimToken,
        event_id: attempt.eventId,
        channel: attempt.channel,
        adapter_key: attempt.adapterKey,
        provider_key: attempt.providerKey,
        sender_mode: attempt.senderMode,
        external_message_id: attempt.externalMessageId,
        retry_category: attempt.retryCategory,
        provider_status_code: attempt.providerStatusCode,
        outcome: attempt.outcome,
        message: attempt.message
      }))
    )
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapAttemptRow(row as AttemptLogRow));
}

export async function getNotificationDeliveryRunDetail(runId: string): Promise<NotificationDeliveryRunDetail | null> {
  return getNotificationDeliveryRunDetailPage(runId);
}

export async function getNotificationDeliveryRunDetailPage(
  runId: string,
  options: {
    limit?: number;
    offset?: number;
    cursor?: string | null;
  } = {}
): Promise<NotificationDeliveryRunDetail | null> {
  const supabase = createAdminSupabaseClient();
  const limit = Math.max(1, Math.min(options.limit ?? 25, 100));
  const parsedCursor = options.cursor ? Number.parseInt(options.cursor, 10) : Number.NaN;
  const offset = Math.max(
    0,
    Number.isFinite(parsedCursor) ? parsedCursor : (options.offset ?? 0)
  );
  const { data: runData, error: runError } = await supabase
    .from("notification_delivery_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (runError && runError.code !== "PGRST116") {
    throw new Error(runError.message);
  }

  if (!runData) {
    return null;
  }

  const { count: totalAttempts, error: attemptCountError } = await supabase
    .from("notification_delivery_attempt_logs")
    .select("id", { count: "exact", head: true })
    .eq("run_id", runId);

  if (attemptCountError) {
    throw new Error(attemptCountError.message);
  }

  const { data: attempts, error: attemptsError } = await supabase
    .from("notification_delivery_attempt_logs")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (attemptsError) {
    throw new Error(attemptsError.message);
  }

  const { data: aggregateAttempts, error: aggregateAttemptsError } = await supabase
    .from("notification_delivery_attempt_logs")
    .select(
      "id, run_id, claim_token, event_id, channel, adapter_key, provider_key, sender_mode, external_message_id, retry_category, provider_status_code, outcome, message, created_at"
    )
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (aggregateAttemptsError) {
    throw new Error(aggregateAttemptsError.message);
  }

  const mappedAttempts = (attempts ?? []).map((row) => mapAttemptRow(row as AttemptLogRow));
  const allAttempts = (aggregateAttempts ?? []).map((row) => mapAttemptRow(row as AttemptLogRow));
  const eventIds = [...new Set(mappedAttempts.map((attempt) => attempt.eventId))];
  let attemptsWithSnapshots = mappedAttempts;

  if (eventIds.length) {
    const { data: eventSnapshots, error: eventSnapshotError } = await supabase
      .from("notification_events")
      .select("id, state, next_retry_at, attempt_count")
      .in("id", eventIds);

    if (eventSnapshotError) {
      throw new Error(eventSnapshotError.message);
    }

    const snapshotMap = new Map(
      (eventSnapshots ?? []).map((row) => [row.id, row as EventSnapshotRow])
    );
    attemptsWithSnapshots = mappedAttempts.map((attempt) =>
      applyEventSnapshot(attempt, snapshotMap.get(attempt.eventId))
    );
  }

  const aggregates: NotificationDeliveryAttemptAggregates =
    buildNotificationDeliveryAttemptAggregates(allAttempts);
  const total = totalAttempts ?? allAttempts.length;

  return {
    run: mapRunRow(runData as RunRow),
    attempts: attemptsWithSnapshots,
    aggregates,
    page: {
      offset,
      limit,
      total,
      hasMore: offset + attemptsWithSnapshots.length < total,
      cursorType: "offset",
      nextCursor: offset + attemptsWithSnapshots.length < total ? String(offset + limit) : null,
      previousCursor: offset > 0 ? String(Math.max(offset - limit, 0)) : null
    }
  };
}

export async function listLatestNotificationDeliveryAttemptsForEvents(eventIds: string[]) {
  if (!eventIds.length) {
    return [] as NotificationDeliveryAttemptLog[];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notification_delivery_attempt_logs")
    .select(
      "id, run_id, claim_token, event_id, channel, adapter_key, provider_key, sender_mode, external_message_id, retry_category, provider_status_code, outcome, message, created_at"
    )
    .in("event_id", eventIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const latestByEventId = new Map<string, NotificationDeliveryAttemptLog>();

  for (const row of data ?? []) {
    const attempt = mapAttemptRow(row as AttemptLogRow);

    if (!latestByEventId.has(attempt.eventId)) {
      latestByEventId.set(attempt.eventId, attempt);
    }
  }

  return eventIds
    .map((eventId) => latestByEventId.get(eventId))
    .filter((attempt): attempt is NotificationDeliveryAttemptLog => Boolean(attempt));
}
