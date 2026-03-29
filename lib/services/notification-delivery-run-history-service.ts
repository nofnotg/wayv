import type {
  NotificationDeliveryRunRecord,
  NotificationExecutionRunSummary
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type DeliveryRunRow = {
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

function mapDeliveryRunRow(row: DeliveryRunRow): NotificationDeliveryRunRecord {
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

export async function recordNotificationDeliveryRun(input: {
  requestedLimit?: number;
  summary: NotificationExecutionRunSummary;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notification_delivery_runs")
    .insert({
      claim_token: input.summary.claimToken,
      ran_at: input.summary.ranAt,
      requested_limit: input.requestedLimit ?? null,
      claimed_count: input.summary.claimedCount,
      sent_count: input.summary.sentCount,
      failed_count: input.summary.failedCount,
      retryable_count: input.summary.retryableCount,
      guardrail_skipped_count: input.summary.guardrailSkippedCount
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "notification-delivery-run-record-failed");
  }

  return mapDeliveryRunRow(data as DeliveryRunRow);
}

export async function listNotificationDeliveryRuns(limit = 10) {
  const supabase = createAdminSupabaseClient();
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const { data, error } = await supabase
    .from("notification_delivery_runs")
    .select("*")
    .order("ran_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapDeliveryRunRow(row as DeliveryRunRow));
}
