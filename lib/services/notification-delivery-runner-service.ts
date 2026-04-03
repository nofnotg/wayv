import type {
  NotificationChannel,
  NotificationExecutionRunResult,
  NotificationExecutionRunSummary
} from "@/lib/domain/types";
import { buildNotificationDeliveryAttemptAggregatesFromFields } from "@/lib/services/notification-delivery-attempt-aggregation-service";
import { recordNotificationDeliveryAttemptLogs } from "@/lib/services/notification-delivery-attempt-log-service";
import { recordNotificationDeliveryRun } from "@/lib/services/notification-delivery-run-history-service";
import {
  NOTIFICATION_DELIVERY_MAX_ATTEMPTS,
  claimDeliverableNotificationBatch,
  hasNotificationReachedMaxAttempts,
  markNotificationBatchFailed,
  markNotificationBatchRetryable,
  markNotificationBatchSent
} from "@/lib/services/notification-delivery-service";
import { resolveNotificationRetryPolicy } from "@/lib/services/notification-retry-policy-service";
import {
  getNotificationSenderAdapter,
  prepareNotificationDeliveryBatchForSender
} from "@/lib/services/notification-sender-adapter";

type NotificationRunnerError = Error & {
  retryable?: boolean;
  retryCategory?: NotificationExecutionRunResult["retryCategory"];
  providerStatusCode?: string | null;
  externalMessageId?: string | null;
};

export type NotificationDeliveryRunnerInput = {
  limit?: number;
  userId?: string;
  channel?: NotificationChannel;
  claimTtlMinutes?: number;
  retryAfterMinutes?: number;
};

export type NotificationDeliveryRunResult = {
  batch: {
    claimToken: string;
    claimedAt: string;
    claimExpiresAt: string;
    claimedCount: number;
  };
  results: NotificationExecutionRunResult[];
  summary: NotificationExecutionRunSummary;
  run: {
    id: string;
    claimToken: string;
    ranAt: string;
    requestedLimit: number | null;
    claimedCount: number;
    sentCount: number;
    failedCount: number;
    retryableCount: number;
    guardrailSkippedCount: number;
  };
};

function normalizeRunnerError(error: unknown): NotificationRunnerError {
  if (error instanceof Error) {
    return error as NotificationRunnerError;
  }

  return new Error("unknown-delivery-error") as NotificationRunnerError;
}

export async function runNotificationDeliveryBatch(
  input: NotificationDeliveryRunnerInput = {}
): Promise<NotificationDeliveryRunResult> {
  const ranAt = new Date().toISOString();
  const batch = await claimDeliverableNotificationBatch(input);
  const senderBatch = prepareNotificationDeliveryBatchForSender(batch);
  const results: NotificationExecutionRunResult[] = [];

  let sentCount = 0;
  let failedCount = 0;
  let retryableCount = 0;
  let guardrailSkippedCount = 0;

  for (const item of senderBatch.items) {
    const eventId = item.event.id;

    if (hasNotificationReachedMaxAttempts(item.event)) {
      await markNotificationBatchFailed({
        eventIds: [eventId],
        claimToken: batch.claimToken,
        lastError: `max-attempts-reached:${NOTIFICATION_DELIVERY_MAX_ATTEMPTS}`
      });
      failedCount += 1;
      guardrailSkippedCount += 1;
      results.push({
        eventId,
        channel: item.event.channel,
        adapterKey: item.adapterKey,
        providerKey: item.providerKey,
        senderMode: item.senderMode,
        externalMessageId: null,
        retryCategory: null,
        providerStatusCode: null,
        outcome: "guardrail_skipped",
        message: "max-attempts-reached"
      });
      continue;
    }

    try {
      const adapter = getNotificationSenderAdapter(item.event.channel);
      const previewResult = await adapter.previewSend(item);
      await markNotificationBatchSent({
        eventIds: [eventId],
        claimToken: batch.claimToken
      });
      sentCount += 1;
      results.push({
        eventId,
        channel: item.event.channel,
        adapterKey: item.adapterKey,
        providerKey: previewResult.providerKey,
        senderMode: previewResult.senderMode,
        externalMessageId: previewResult.externalMessageId,
        retryCategory: previewResult.retryCategory,
        providerStatusCode: previewResult.providerStatusCode,
        outcome: "sent",
        message: null
      });
    } catch (error) {
      const normalizedError = normalizeRunnerError(error);
      const message = normalizedError.message || "delivery-preview-failed";

      if (normalizedError.retryable) {
        const retryPolicy = resolveNotificationRetryPolicy({
          channel: item.event.channel,
          attemptCount: item.event.attemptCount ?? 0
        });
        await markNotificationBatchRetryable({
          eventIds: [eventId],
          claimToken: batch.claimToken,
          retryAfterMinutes: input.retryAfterMinutes ?? retryPolicy.retryAfterMinutes,
          lastError: message
        });
        retryableCount += 1;
        results.push({
          eventId,
          channel: item.event.channel,
          adapterKey: item.adapterKey,
          providerKey: item.providerKey,
          senderMode: item.senderMode,
          externalMessageId: normalizedError.externalMessageId ?? null,
          retryCategory: normalizedError.retryCategory ?? "provider_unavailable",
          providerStatusCode: normalizedError.providerStatusCode ?? null,
          outcome: "retryable",
          message
        });
        continue;
      }

      await markNotificationBatchFailed({
        eventIds: [eventId],
        claimToken: batch.claimToken,
        lastError: message
      });
      failedCount += 1;
      results.push({
        eventId,
        channel: item.event.channel,
        adapterKey: item.adapterKey,
        providerKey: item.providerKey,
        senderMode: item.senderMode,
        externalMessageId: normalizedError.externalMessageId ?? null,
        retryCategory: normalizedError.retryCategory ?? "unknown",
        providerStatusCode: normalizedError.providerStatusCode ?? null,
        outcome: "failed",
        message
      });
    }
  }

  const summary: NotificationExecutionRunSummary = {
    claimToken: batch.claimToken,
    ranAt,
    claimedCount: batch.events.length,
    sentCount,
    failedCount,
    retryableCount,
    guardrailSkippedCount,
    emptyBatch: batch.events.length === 0
  };

  const run = await recordNotificationDeliveryRun({
    requestedLimit: input.limit,
    summary,
    attemptAggregates: buildNotificationDeliveryAttemptAggregatesFromFields(
      results.map((result) => ({
        outcome: result.outcome,
        channel: result.channel,
        providerKey: result.providerKey,
        retryCategory: result.retryCategory,
        senderMode: result.senderMode
      }))
    )
  });
  await recordNotificationDeliveryAttemptLogs({
    runId: run.id,
    claimToken: batch.claimToken,
    attempts: results
  });

  return {
    batch: {
      claimToken: batch.claimToken,
      claimedAt: batch.claimedAt,
      claimExpiresAt: batch.claimExpiresAt,
      claimedCount: batch.events.length
    },
    results,
    summary,
    run
  };
}
