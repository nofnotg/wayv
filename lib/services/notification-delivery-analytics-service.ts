import type {
  NotificationDeliveryAnalytics,
  NotificationDeliveryScope,
  NotificationEvent
} from "@/lib/domain/types";

function isClaimExpired(event: NotificationEvent, now: Date) {
  return Boolean(
    event.claimToken &&
      event.claimExpiresAt &&
      new Date(event.claimExpiresAt).getTime() <= now.getTime()
  );
}

function isClaimActive(event: NotificationEvent, now: Date) {
  return Boolean(
    event.claimToken &&
      event.claimExpiresAt &&
      new Date(event.claimExpiresAt).getTime() > now.getTime()
  );
}

export function filterNotificationDeliveryEventsByScope(
  events: NotificationEvent[],
  scope: NotificationDeliveryScope,
  now = new Date()
) {
  if (scope === "ready") {
    return events.filter(
      (event) =>
        (event.state === "pending" || event.state === "operational_only") &&
        !event.claimToken
    );
  }

  if (scope === "claimed") {
    return events.filter((event) => isClaimActive(event, now));
  }

  if (scope === "expired_claims") {
    return events.filter((event) => isClaimExpired(event, now));
  }

  if (scope === "retryable_backlog") {
    return events.filter((event) => event.state === "retryable");
  }

  if (scope === "sent") {
    return events.filter((event) => event.state === "sent");
  }

  return events.filter((event) => event.state === "failed");
}

export function buildNotificationDeliveryAnalytics(
  events: NotificationEvent[],
  now = new Date()
): NotificationDeliveryAnalytics {
  const latestAttemptAt =
    events
      .map((event) => event.lastAttemptAt)
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => right.localeCompare(left))[0] ?? null;

  const totalAttempts = events.reduce(
    (sum, event) => sum + (event.attemptCount ?? 0),
    0
  );

  return {
    readyCount: filterNotificationDeliveryEventsByScope(events, "ready", now).length,
    claimedCount: filterNotificationDeliveryEventsByScope(events, "claimed", now).length,
    expiredClaimCount: filterNotificationDeliveryEventsByScope(events, "expired_claims", now)
      .length,
    sentCount: filterNotificationDeliveryEventsByScope(events, "sent", now).length,
    failedCount: filterNotificationDeliveryEventsByScope(events, "failed", now).length,
    retryableCount: filterNotificationDeliveryEventsByScope(events, "retryable_backlog", now)
      .length,
    latestAttemptAt,
    averageAttemptCount: events.length
      ? Number((totalAttempts / events.length).toFixed(2))
      : 0
  };
}
