import type {
  NotificationChannel,
  NotificationExecutionRunResult,
  NotificationExecutionRunSummary
} from "@/lib/domain/types";
import {
  NOTIFICATION_DELIVERY_MAX_ATTEMPTS,
  claimDeliverableNotificationBatch,
  hasNotificationReachedMaxAttempts,
  markNotificationBatchFailed,
  markNotificationBatchRetryable,
  markNotificationBatchSent
} from "@/lib/services/notification-delivery-service";
import {
  getNotificationSenderAdapter,
  prepareNotificationDeliveryBatchForSender
} from "@/lib/services/notification-sender-adapter";

type NotificationRunnerError = Error & {
  retryable?: boolean;
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
        outcome: "guardrail_skipped",
        message: "max-attempts-reached"
      });
      continue;
    }

    try {
      const adapter = getNotificationSenderAdapter(item.event.channel);
      await adapter.previewSend(item);
      await markNotificationBatchSent({
        eventIds: [eventId],
        claimToken: batch.claimToken
      });
      sentCount += 1;
      results.push({
        eventId,
        outcome: "sent",
        message: null
      });
    } catch (error) {
      const normalizedError = normalizeRunnerError(error);
      const message = normalizedError.message || "delivery-preview-failed";

      if (normalizedError.retryable) {
        await markNotificationBatchRetryable({
          eventIds: [eventId],
          claimToken: batch.claimToken,
          retryAfterMinutes: input.retryAfterMinutes,
          lastError: message
        });
        retryableCount += 1;
        results.push({
          eventId,
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
        outcome: "failed",
        message
      });
    }
  }

  return {
    batch: {
      claimToken: batch.claimToken,
      claimedAt: batch.claimedAt,
      claimExpiresAt: batch.claimExpiresAt,
      claimedCount: batch.events.length
    },
    results,
    summary: {
      claimToken: batch.claimToken,
      claimedCount: batch.events.length,
      sentCount,
      failedCount,
      retryableCount,
      guardrailSkippedCount,
      emptyBatch: batch.events.length === 0
    }
  };
}
