import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildRetryableBacklogDrilldown,
  buildRetryableBacklogSummary
} from "../../lib/services/notification-delivery-backlog-summary-service";
import { getNotificationRetryableBacklogSnapshot } from "../../lib/services/notification-delivery-observability-service";

const {
  listNotificationDeliveryEvents,
  listLatestNotificationDeliveryAttemptsForEvents
} = vi.hoisted(() => ({
  listNotificationDeliveryEvents: vi.fn(),
  listLatestNotificationDeliveryAttemptsForEvents: vi.fn()
}));

vi.mock("@/lib/services/notification-delivery-service", () => ({
  listNotificationDeliveryEvents
}));

vi.mock("@/lib/services/notification-delivery-attempt-log-service", () => ({
  listLatestNotificationDeliveryAttemptsForEvents
}));

describe("notification delivery observability service", () => {
  const events = [
    {
      id: "event-1",
      userId: "viewer-1",
      type: "for_you_wave" as const,
      channel: "email" as const,
      lane: "for_you" as const,
      title: "email retry",
      body: "body",
      state: "retryable" as const,
      createdAt: "2026-04-03T01:00:00.000Z",
      nextRetryAt: "2999-01-01T00:00:00.000Z",
      attemptCount: 1,
      sentAt: null,
      readAt: null
    },
    {
      id: "event-2",
      userId: "viewer-2",
      type: "quiet_digest" as const,
      channel: "push" as const,
      lane: "quiet_digest" as const,
      title: "push retry",
      body: "body",
      state: "retryable" as const,
      createdAt: "2026-04-03T01:05:00.000Z",
      nextRetryAt: "2020-01-01T00:00:00.000Z",
      attemptCount: 2,
      sentAt: null,
      readAt: null
    }
  ];

  const attempts = [
    {
      id: "attempt-1",
      runId: "run-1",
      claimToken: "claim-1",
      eventId: "event-1",
      channel: "email" as const,
      adapterKey: "noop-email",
      providerKey: "email-noop",
      senderMode: "noop" as const,
      externalMessageId: null,
      retryCategory: "rate_limited" as const,
      providerStatusCode: "429",
      outcome: "retryable" as const,
      message: "rate-limited",
      createdAt: "2026-04-03T01:10:00.000Z"
    },
    {
      id: "attempt-2",
      runId: "run-1",
      claimToken: "claim-2",
      eventId: "event-2",
      channel: "push" as const,
      adapterKey: "noop-push",
      providerKey: "push-noop",
      senderMode: "noop" as const,
      externalMessageId: null,
      retryCategory: "provider_unavailable" as const,
      providerStatusCode: "503",
      outcome: "retryable" as const,
      message: "provider-unavailable",
      createdAt: "2026-04-03T01:11:00.000Z"
    }
  ];

  it("builds a compact retryable backlog summary", () => {
    const summary = buildRetryableBacklogSummary(events);

    expect(summary.total).toBe(2);
    expect(summary.dueNowCount).toBe(1);
    expect(summary.waitingCount).toBe(1);
    expect(summary.byChannel).toEqual(
      expect.arrayContaining([
        { channel: "email", count: 1 },
        { channel: "push", count: 1 }
      ])
    );
  });

  it("builds provider/category/channel drilldown buckets", () => {
    const drilldown = buildRetryableBacklogDrilldown(attempts, events);

    expect(drilldown.byProvider).toEqual(
      expect.arrayContaining([
        { key: "email-noop", total: 1, dueNow: 0, waiting: 1 },
        { key: "push-noop", total: 1, dueNow: 1, waiting: 0 }
      ])
    );
    expect(drilldown.byRetryCategory).toEqual(
      expect.arrayContaining([
        { key: "rate_limited", total: 1, dueNow: 0, waiting: 1 },
        { key: "provider_unavailable", total: 1, dueNow: 1, waiting: 0 }
      ])
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("applies compact backlog filters while preserving the summary shape", async () => {
    listNotificationDeliveryEvents.mockResolvedValue(events);
    listLatestNotificationDeliveryAttemptsForEvents.mockResolvedValue(attempts);

    const snapshot = await getNotificationRetryableBacklogSnapshot({
      filters: {
        channel: "email",
        provider: "email-noop",
        retryCategory: "rate_limited",
        timing: "waiting"
      }
    });

    expect(snapshot.filters).toEqual({
      channel: "email",
      provider: "email-noop",
      retryCategory: "rate_limited",
      timing: "waiting"
    });
    expect(snapshot.summary.total).toBe(1);
    expect(snapshot.drilldown.byProvider).toEqual([
      { key: "email-noop", total: 1, dueNow: 0, waiting: 1 }
    ]);
  });
});
