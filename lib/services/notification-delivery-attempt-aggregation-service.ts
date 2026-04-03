import type {
  NotificationDeliveryAttemptAggregates,
  NotificationDeliveryAttemptAggregateBucket,
  NotificationDeliveryAttemptLog,
  NotificationExecutionRunResult
} from "@/lib/domain/types";

type NotificationDeliveryAttemptAggregateFields = Pick<
  NotificationDeliveryAttemptLog,
  "outcome" | "channel" | "providerKey" | "retryCategory" | "senderMode"
>;

function toBuckets(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }) satisfies NotificationDeliveryAttemptAggregateBucket)
    .sort((left, right) => {
      if (right.count === left.count) {
        return left.key.localeCompare(right.key);
      }

      return right.count - left.count;
    });
}

export function buildNotificationDeliveryAttemptAggregates(
  attempts: NotificationDeliveryAttemptLog[]
): NotificationDeliveryAttemptAggregates {
  return buildNotificationDeliveryAttemptAggregatesFromFields(attempts);
}

export function buildNotificationDeliveryAttemptAggregatesFromFields(
  attempts: NotificationDeliveryAttemptAggregateFields[]
): NotificationDeliveryAttemptAggregates {
  return {
    byOutcome: toBuckets(attempts.map((attempt) => attempt.outcome)),
    byChannel: toBuckets(attempts.map((attempt) => attempt.channel)),
    byProvider: toBuckets(attempts.map((attempt) => attempt.providerKey)),
    byRetryCategory: toBuckets(attempts.map((attempt) => attempt.retryCategory)),
    bySenderMode: toBuckets(attempts.map((attempt) => attempt.senderMode))
  };
}

export function buildNotificationDeliveryAttemptAggregatesForOutcome(
  attempts: NotificationDeliveryAttemptLog[],
  outcome: NotificationExecutionRunResult["outcome"]
) {
  return buildNotificationDeliveryAttemptAggregates(
    attempts.filter((attempt) => attempt.outcome === outcome)
  );
}
