import type {
  NotificationChannel,
  NotificationDeliveryAttemptLog,
  NotificationEvent,
  NotificationRetryableBacklogDrilldown,
  NotificationRetryableBacklogSummary
} from "@/lib/domain/types";
import { filterNotificationDeliveryEventsByScope } from "@/lib/services/notification-delivery-analytics-service";

export function buildRetryableBacklogSummary(
  events: NotificationEvent[]
): NotificationRetryableBacklogSummary {
  const retryableEvents = filterNotificationDeliveryEventsByScope(events, "retryable_backlog");
  const byChannel = new Map<NotificationChannel, number>();
  let dueNowCount = 0;
  let nextRetryAt: string | null = null;
  const now = Date.now();

  for (const event of retryableEvents) {
    byChannel.set(event.channel, (byChannel.get(event.channel) ?? 0) + 1);

    if (event.nextRetryAt) {
      const retryAt = new Date(event.nextRetryAt).getTime();
      if (retryAt <= now) {
        dueNowCount += 1;
      } else if (!nextRetryAt || retryAt < new Date(nextRetryAt).getTime()) {
        nextRetryAt = event.nextRetryAt;
      }
    }
  }

  return {
    total: retryableEvents.length,
    byChannel: [...byChannel.entries()].map(([channel, count]) => ({ channel, count })),
    dueNowCount,
    waitingCount: Math.max(retryableEvents.length - dueNowCount, 0),
    nextRetryAt
  };
}

export function buildRetryableBacklogDrilldown(
  attempts: NotificationDeliveryAttemptLog[],
  events: NotificationEvent[]
): NotificationRetryableBacklogDrilldown {
  const eventMap = new Map(events.map((event) => [event.id, event]));
  const now = Date.now();

  const createBucketMap = () =>
    new Map<string, { key: string; total: number; dueNow: number; waiting: number }>();
  const byProvider = createBucketMap();
  const byRetryCategory = createBucketMap();
  const byChannel = createBucketMap();

  const bumpBucket = (
    buckets: Map<string, { key: string; total: number; dueNow: number; waiting: number }>,
    key: string,
    dueNow: boolean
  ) => {
    const current = buckets.get(key) ?? { key, total: 0, dueNow: 0, waiting: 0 };
    current.total += 1;
    current.dueNow += dueNow ? 1 : 0;
    current.waiting += dueNow ? 0 : 1;
    buckets.set(key, current);
  };

  for (const attempt of attempts) {
    const relatedEvent = eventMap.get(attempt.eventId);
    const dueNow = Boolean(
      relatedEvent?.nextRetryAt && new Date(relatedEvent.nextRetryAt).getTime() <= now
    );

    bumpBucket(byProvider, attempt.providerKey, dueNow);
    bumpBucket(byChannel, attempt.channel, dueNow);

    if (attempt.retryCategory) {
      bumpBucket(byRetryCategory, attempt.retryCategory, dueNow);
    }
  }

  const toList = (
    buckets: Map<string, { key: string; total: number; dueNow: number; waiting: number }>
  ) =>
    [...buckets.values()].sort((left, right) => {
      if (right.total === left.total) {
        return left.key.localeCompare(right.key);
      }

      return right.total - left.total;
    });

  return {
    byProvider: toList(byProvider),
    byRetryCategory: toList(byRetryCategory),
    byChannel: toList(byChannel)
  };
}
