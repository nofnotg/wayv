import type {
  NotificationChannel,
  NotificationProviderRetryCategory,
  NotificationRetryableBacklogSnapshot,
} from "@/lib/domain/types";
import {
  buildRetryableBacklogDrilldown,
  buildRetryableBacklogSummary
} from "@/lib/services/notification-delivery-backlog-summary-service";
import { listLatestNotificationDeliveryAttemptsForEvents } from "@/lib/services/notification-delivery-attempt-log-service";
import { listNotificationDeliveryEvents } from "@/lib/services/notification-delivery-service";

type NotificationRetryableBacklogFilters = {
  channel?: NotificationChannel | null;
  provider?: string | null;
  retryCategory?: NotificationProviderRetryCategory | null;
  timing?: "due_now" | "waiting" | null;
};

function matchesRetryTiming(nextRetryAt: string | null | undefined, timing?: "due_now" | "waiting" | null) {
  if (!timing) {
    return true;
  }

  if (!nextRetryAt) {
    return timing === "waiting";
  }

  const retryAt = new Date(nextRetryAt).getTime();
  const now = Date.now();

  return timing === "due_now" ? retryAt <= now : retryAt > now;
}

export async function getNotificationRetryableBacklogSnapshot(input?: {
  limit?: number;
  filters?: NotificationRetryableBacklogFilters;
}): Promise<NotificationRetryableBacklogSnapshot> {
  const rawEvents = await listNotificationDeliveryEvents({
    limit: input?.limit ?? 100,
    states: ["retryable"],
    channel: input?.filters?.channel ?? undefined
  });
  const rawAttempts = await listLatestNotificationDeliveryAttemptsForEvents(
    rawEvents.map((event) => event.id)
  );
  const latestAttemptByEventId = new Map(rawAttempts.map((attempt) => [attempt.eventId, attempt]));
  const events = rawEvents.filter((event) => {
    if (!matchesRetryTiming(event.nextRetryAt, input?.filters?.timing)) {
      return false;
    }

    const latestAttempt = latestAttemptByEventId.get(event.id);
    if (input?.filters?.provider && latestAttempt?.providerKey !== input.filters.provider) {
      return false;
    }

    if (
      input?.filters?.retryCategory &&
      latestAttempt?.retryCategory !== input.filters.retryCategory
    ) {
      return false;
    }

    return true;
  });
  const allowedEventIds = new Set(events.map((event) => event.id));
  const attempts = rawAttempts.filter((attempt) => allowedEventIds.has(attempt.eventId));

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      channel: input?.filters?.channel ?? "all",
      provider: input?.filters?.provider ?? "all",
      retryCategory: input?.filters?.retryCategory ?? "all",
      timing: input?.filters?.timing ?? "all"
    },
    events,
    summary: buildRetryableBacklogSummary(events),
    drilldown: buildRetryableBacklogDrilldown(attempts, events)
  };
}
