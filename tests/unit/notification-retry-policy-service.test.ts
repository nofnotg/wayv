import { describe, expect, it } from "vitest";

import { resolveNotificationRetryPolicy } from "../../lib/services/notification-retry-policy-service";

describe("notification retry policy service", () => {
  it("calculates channel-aware retry delays", () => {
    expect(
      resolveNotificationRetryPolicy({
        channel: "inapp",
        attemptCount: 0
      })
    ).toMatchObject({
      retryAfterMinutes: 5,
      maxAttempts: 3
    });

    expect(
      resolveNotificationRetryPolicy({
        channel: "email",
        attemptCount: 1
      })
    ).toMatchObject({
      retryAfterMinutes: 60,
      maxAttempts: 3
    });

    expect(
      resolveNotificationRetryPolicy({
        channel: "push",
        attemptCount: 2
      })
    ).toMatchObject({
      retryAfterMinutes: 120,
      maxAttempts: 3
    });
  });
});
