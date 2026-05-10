import { describe, expect, it } from "vitest";

import {
  buildNotificationDeliveryAttemptAggregates,
  buildNotificationDeliveryAttemptAggregatesForOutcome
} from "../../lib/services/notification-delivery-attempt-aggregation-service";

describe("notification delivery attempt aggregation service", () => {
  const attempts = [
    {
      id: "attempt-1",
      runId: "run-1",
      claimToken: "claim-1",
      eventId: "event-1",
      channel: "email",
      adapterKey: "noop-email",
      providerKey: "email-noop",
      senderMode: "noop",
      externalMessageId: null,
      retryCategory: "rate_limited",
      providerStatusCode: "429",
      outcome: "retryable",
      message: "rate-limited",
      createdAt: "2026-03-30T08:00:00.000Z"
    },
    {
      id: "attempt-2",
      runId: "run-1",
      claimToken: "claim-1",
      eventId: "event-2",
      channel: "email",
      adapterKey: "noop-email",
      providerKey: "email-noop",
      senderMode: "noop",
      externalMessageId: null,
      retryCategory: "invalid_recipient",
      providerStatusCode: "400",
      outcome: "failed",
      message: "invalid-recipient",
      createdAt: "2026-03-30T08:01:00.000Z"
    },
    {
      id: "attempt-3",
      runId: "run-1",
      claimToken: "claim-1",
      eventId: "event-3",
      channel: "push",
      adapterKey: "noop-push",
      providerKey: "push-noop",
      senderMode: "noop",
      externalMessageId: null,
      retryCategory: "provider_unavailable",
      providerStatusCode: "503",
      outcome: "retryable",
      message: "provider-unavailable",
      createdAt: "2026-03-30T08:02:00.000Z"
    }
  ] as const;

  it("builds compact aggregate buckets across key delivery dimensions", () => {
    const aggregates = buildNotificationDeliveryAttemptAggregates([...attempts]);

    expect(aggregates.byOutcome).toEqual([
      { key: "retryable", count: 2 },
      { key: "failed", count: 1 }
    ]);
    expect(aggregates.byChannel).toEqual([
      { key: "email", count: 2 },
      { key: "push", count: 1 }
    ]);
    expect(aggregates.byProvider).toEqual([
      { key: "email-noop", count: 2 },
      { key: "push-noop", count: 1 }
    ]);
    expect(aggregates.bySenderMode).toEqual([{ key: "noop", count: 3 }]);
  });

  it("can derive outcome-specific summaries for compact run cards", () => {
    const failedAggregates = buildNotificationDeliveryAttemptAggregatesForOutcome(
      [...attempts],
      "failed"
    );
    const retryableAggregates = buildNotificationDeliveryAttemptAggregatesForOutcome(
      [...attempts],
      "retryable"
    );

    expect(failedAggregates.byRetryCategory).toEqual([
      { key: "invalid_recipient", count: 1 }
    ]);
    expect(retryableAggregates.byChannel).toEqual([
      { key: "email", count: 1 },
      { key: "push", count: 1 }
    ]);
  });
});
