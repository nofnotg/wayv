import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getNotificationDeliveryRunDetailPage = vi.fn();

vi.mock("@/lib/services/notification-delivery-attempt-log-service", () => ({
  getNotificationDeliveryRunDetailPage
}));

describe("notification delivery run detail debug route", () => {
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
      "../../app/api/internal/debug/notification-delivery-runs/[id]/route"
    );

    const response = await GET(
      new Request("http://localhost/api/internal/debug/notification-delivery-runs/run-1") as never,
      { params: Promise.resolve({ id: "run-1" }) }
    );

    expect(response.status).toBe(403);
  });

  it("returns a run and its attempts for authorized requests", async () => {
    getNotificationDeliveryRunDetailPage.mockResolvedValue({
      run: { id: "run-1" },
      attempts: [{ id: "attempt-1" }],
      aggregates: {
        byOutcome: [],
        byChannel: [],
        byProvider: [],
        byRetryCategory: [],
        bySenderMode: []
      },
      page: {
        offset: 0,
        limit: 25,
        total: 1,
        hasMore: false
      }
    });
    const { GET } = await import(
      "../../app/api/internal/debug/notification-delivery-runs/[id]/route"
    );

    const response = await GET(
      new Request("http://localhost/api/internal/debug/notification-delivery-runs/run-1?limit=20&offset=40", {
        headers: {
          "x-cron-secret": "test-secret"
        }
      }) as never,
      { params: Promise.resolve({ id: "run-1" }) }
    );

    expect(getNotificationDeliveryRunDetailPage).toHaveBeenCalledWith("run-1", {
      limit: 20,
      offset: 40
    });
    expect(response.status).toBe(200);
  });
});
