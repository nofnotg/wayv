import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getNotificationRetryableBacklogSnapshot = vi.fn();

vi.mock("@/lib/services/notification-delivery-observability-service", () => ({
  getNotificationRetryableBacklogSnapshot
}));

describe("notification retryable backlog debug route", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = previousSecret;
  });

  it("requires the internal secret", async () => {
    const { GET } = await import(
      "../../app/api/internal/debug/notification-retryable-backlog/route"
    );

    const response = await GET(
      new Request("http://localhost/api/internal/debug/notification-retryable-backlog") as never
    );

    expect(response.status).toBe(403);
  });

  it("returns a compact retryable backlog snapshot", async () => {
    getNotificationRetryableBacklogSnapshot.mockResolvedValue({
      generatedAt: "2026-04-03T01:30:00.000Z",
      filters: {
        channel: "all",
        provider: "all",
        retryCategory: "all",
        timing: "all"
      },
      events: [],
      summary: {
        total: 2,
        dueNowCount: 1,
        waitingCount: 1,
        nextRetryAt: "2026-04-03T02:00:00.000Z",
        byChannel: [{ channel: "email", count: 2 }]
      },
      drilldown: {
        byProvider: [{ key: "email-noop", total: 2, dueNow: 1, waiting: 1 }],
        byRetryCategory: [{ key: "rate_limited", total: 2, dueNow: 1, waiting: 1 }],
        byChannel: [{ key: "email", total: 2, dueNow: 1, waiting: 1 }]
      }
    });

    const { GET } = await import(
      "../../app/api/internal/debug/notification-retryable-backlog/route"
    );

    const response = await GET(
      new Request(
        "http://localhost/api/internal/debug/notification-retryable-backlog?limit=40",
        {
          headers: {
            "x-cron-secret": "test-secret"
          }
        }
      ) as never
    );

    expect(getNotificationRetryableBacklogSnapshot).toHaveBeenCalledWith({
      limit: 40,
      filters: {
        channel: null,
        provider: null,
        retryCategory: null,
        timing: null
      }
    });
    expect(response.status).toBe(200);
  });

  it("passes compact query filters through to the backlog snapshot service", async () => {
    getNotificationRetryableBacklogSnapshot.mockResolvedValue({
      generatedAt: "2026-04-03T01:30:00.000Z",
      filters: {
        channel: "email",
        provider: "email-noop",
        retryCategory: "rate_limited",
        timing: "waiting"
      },
      events: [],
      summary: {
        total: 1,
        dueNowCount: 0,
        waitingCount: 1,
        nextRetryAt: "2026-04-03T02:00:00.000Z",
        byChannel: [{ channel: "email", count: 1 }]
      },
      drilldown: {
        byProvider: [{ key: "email-noop", total: 1, dueNow: 0, waiting: 1 }],
        byRetryCategory: [{ key: "rate_limited", total: 1, dueNow: 0, waiting: 1 }],
        byChannel: [{ key: "email", total: 1, dueNow: 0, waiting: 1 }]
      }
    });

    const { GET } = await import(
      "../../app/api/internal/debug/notification-retryable-backlog/route"
    );

    await GET(
      new Request(
        "http://localhost/api/internal/debug/notification-retryable-backlog?limit=20&channel=email&provider=email-noop&retryCategory=rate_limited&timing=waiting",
        {
          headers: {
            "x-cron-secret": "test-secret"
          }
        }
      ) as never
    );

    expect(getNotificationRetryableBacklogSnapshot).toHaveBeenCalledWith({
      limit: 20,
      filters: {
        channel: "email",
        provider: "email-noop",
        retryCategory: "rate_limited",
        timing: "waiting"
      }
    });
  });
});
