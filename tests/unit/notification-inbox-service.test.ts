import { describe, expect, it } from "vitest";

import { resolveNotificationEventState } from "../../lib/services/notification-inbox-service";

describe("notification inbox service", () => {
  it("marks pending events as read", () => {
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
});
