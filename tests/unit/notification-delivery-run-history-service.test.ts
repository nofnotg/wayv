import { describe, expect, it } from "vitest";

import { parseNotificationDeliveryRunAggregates } from "../../lib/services/notification-delivery-run-history-service";

describe("notification delivery run history service", () => {
  it("parses cached attempt aggregates safely", () => {
    expect(
      parseNotificationDeliveryRunAggregates({
        byOutcome: [{ key: "sent", count: 2 }],
        byChannel: [{ key: "email", count: 2 }],
        byProvider: [{ key: "email-noop", count: 2 }],
        byRetryCategory: [],
        bySenderMode: [{ key: "noop", count: 2 }]
      })
    ).toEqual({
      byOutcome: [{ key: "sent", count: 2 }],
      byChannel: [{ key: "email", count: 2 }],
      byProvider: [{ key: "email-noop", count: 2 }],
      byRetryCategory: [],
      bySenderMode: [{ key: "noop", count: 2 }]
    });
  });

  it("returns null for missing cached aggregates", () => {
    expect(parseNotificationDeliveryRunAggregates(null)).toBeNull();
  });
});
