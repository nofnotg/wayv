import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listNotificationDeliveryRuns = vi.fn();

vi.mock("@/lib/services/notification-delivery-run-history-service", () => ({
  listNotificationDeliveryRuns
}));

describe("notification delivery runs debug route", () => {
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
      "../../app/api/internal/debug/notification-delivery-runs/route"
    );

    const response = await GET(
      new Request("http://localhost/api/internal/debug/notification-delivery-runs") as never
    );

    expect(response.status).toBe(403);
  });

  it("lists recent execution runs for authorized requests", async () => {
    listNotificationDeliveryRuns.mockResolvedValue([{ id: "run-1" }]);
    const { GET } = await import(
      "../../app/api/internal/debug/notification-delivery-runs/route"
    );

    const response = await GET(
      new Request(
        "http://localhost/api/internal/debug/notification-delivery-runs?limit=6",
        {
          headers: {
            "x-cron-secret": "test-secret"
          }
        }
      ) as never
    );

    expect(listNotificationDeliveryRuns).toHaveBeenCalledWith(6);
    expect(response.status).toBe(200);
  });
});
