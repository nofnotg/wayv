import type {
  NotificationDeliveryAttemptLog,
  NotificationDeliveryRunDetail,
  NotificationDeliveryRunRecord,
  NotificationExecutionRunResult
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type AttemptLogRow = {
  id: string;
  run_id: string;
  claim_token: string;
  event_id: string;
  channel: NotificationDeliveryAttemptLog["channel"];
  adapter_key: string;
  provider_key: string | null;
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
    externalMessageId: row.external_message_id,
    retryCategory: row.retry_category,
    providerStatusCode: row.provider_status_code,
    outcome: row.outcome,
    message: row.message,
    createdAt: row.created_at
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
  const supabase = createAdminSupabaseClient();
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

  const { data: attempts, error: attemptsError } = await supabase
    .from("notification_delivery_attempt_logs")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (attemptsError) {
    throw new Error(attemptsError.message);
  }

  return {
    run: mapRunRow(runData as RunRow),
    attempts: (attempts ?? []).map((row) => mapAttemptRow(row as AttemptLogRow))
  };
}
