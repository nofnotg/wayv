import type {
  NotificationRetryableBacklogSnapshot,
} from "@/lib/domain/types";
import {
  buildRetryableBacklogDrilldown,
  buildRetryableBacklogSummary
} from "@/lib/services/notification-delivery-backlog-summary-service";
import { listLatestNotificationDeliveryAttemptsForEvents } from "@/lib/services/notification-delivery-attempt-log-service";
import { listNotificationDeliveryEvents } from "@/lib/services/notification-delivery-service";

export async function getNotificationRetryableBacklogSnapshot(input?: {
  limit?: number;
}): Promise<NotificationRetryableBacklogSnapshot> {
  const events = await listNotificationDeliveryEvents({
    limit: input?.limit ?? 100,
    states: ["retryable"]
  });
  const attempts = await listLatestNotificationDeliveryAttemptsForEvents(
    events.map((event) => event.id)
  );

  return {
    generatedAt: new Date().toISOString(),
    events,
    summary: buildRetryableBacklogSummary(events),
    drilldown: buildRetryableBacklogDrilldown(attempts, events)
  };
}
