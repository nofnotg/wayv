import type {
  NotificationCandidateLane,
  NotificationEvent,
  NotificationEventState,
  NotificationLifecycleAction
} from "@/lib/domain/types";

export const inboxVisibleNotificationStates: NotificationEventState[] = [
  "pending",
  "operational_only",
  "sent",
  "read",
  "dismissed"
];

export const unreadNotificationStates: NotificationEventState[] = [
  "pending",
  "operational_only",
  "sent"
];

export const deliverableNotificationStates: NotificationEventState[] = [
  "pending",
  "operational_only",
  "retryable"
];

export function isNotificationEventInboxVisible(
  state: NotificationEventState
) {
  return inboxVisibleNotificationStates.includes(state);
}

export function isNotificationEventUnread(input: Pick<NotificationEvent, "state" | "readAt">) {
  return unreadNotificationStates.includes(input.state) && !input.readAt;
}

export function isNotificationEventDeliverable(
  input: Pick<NotificationEvent, "state" | "readAt" | "nextRetryAt">,
  now = new Date()
) {
  if (input.readAt) {
    return false;
  }

  if (input.state === "retryable") {
    if (!input.nextRetryAt) {
      return true;
    }

    return new Date(input.nextRetryAt).getTime() <= now.getTime();
  }

  return deliverableNotificationStates.includes(input.state);
}

export function resolveNotificationEventState(
  currentState: NotificationEventState,
  action: NotificationLifecycleAction
): NotificationEventState {
  if (action === "read") {
    if (currentState === "dismissed") {
      return "dismissed";
    }

    if (currentState === "read") {
      return "read";
    }

    if (isNotificationEventInboxVisible(currentState)) {
      return "read";
    }
  }

  if (action === "dismiss") {
    if (currentState === "dismissed") {
      return "dismissed";
    }

    if (isNotificationEventInboxVisible(currentState)) {
      return "dismissed";
    }
  }

  if (action === "mark_sent") {
    if (
      currentState === "pending" ||
      currentState === "operational_only" ||
      currentState === "retryable"
    ) {
      return "sent";
    }

    if (currentState === "sent") {
      return "sent";
    }
  }

  if (action === "mark_failed") {
    if (
      currentState === "pending" ||
      currentState === "operational_only" ||
      currentState === "retryable"
    ) {
      return "failed";
    }

    if (currentState === "failed") {
      return "failed";
    }
  }

  if (action === "mark_retryable") {
    if (
      currentState === "pending" ||
      currentState === "operational_only" ||
      currentState === "retryable" ||
      currentState === "failed"
    ) {
      return "retryable";
    }
  }

  return currentState;
}

export function summarizeUnreadNotificationLanes(
  events: Array<Pick<NotificationEvent, "lane" | "state" | "readAt">>
) {
  const summary: Partial<Record<NotificationCandidateLane, number>> = {};

  for (const event of events) {
    if (!isNotificationEventUnread(event)) {
      continue;
    }

    const lane = event.lane ?? "quiet_digest";
    summary[lane] = (summary[lane] ?? 0) + 1;
  }

  return summary;
}
