import { describe, expect, it } from "vitest";

import {
  isNotificationEventDeliverable,
  isNotificationEventUnread,
  resolveNotificationEventState
} from "../../lib/services/notification-lifecycle-service";

describe("notification lifecycle service", () => {
  it("marks pending and operational-only events as read", () => {
    expect(resolveNotificationEventState("pending", "read")).toBe("read");
    expect(resolveNotificationEventState("operational_only", "read")).toBe("read");
  });

  it("preserves dismissed events when read is requested", () => {
    expect(resolveNotificationEventState("dismissed", "read")).toBe("dismissed");
  });

  it("dismisses read and pending events", () => {
    expect(resolveNotificationEventState("read", "dismiss")).toBe("dismissed");
    expect(resolveNotificationEventState("pending", "dismiss")).toBe("dismissed");
  });

  it("recognizes deliverable and unread event combinations coherently", () => {
    expect(isNotificationEventUnread({ state: "pending", readAt: null })).toBe(true);
    expect(isNotificationEventDeliverable({ state: "pending", readAt: null })).toBe(true);
    expect(isNotificationEventDeliverable({ state: "sent", readAt: null })).toBe(false);
    expect(isNotificationEventUnread({ state: "read", readAt: "2026-03-29T10:00:00.000Z" })).toBe(false);
  });

  it("promotes delivery-ready states to sent", () => {
    expect(resolveNotificationEventState("pending", "mark_sent")).toBe("sent");
    expect(resolveNotificationEventState("operational_only", "mark_sent")).toBe("sent");
    expect(resolveNotificationEventState("read", "mark_sent")).toBe("read");
  });
});
