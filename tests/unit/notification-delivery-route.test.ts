import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listDeliverableNotificationEvents = vi.fn();

vi.mock("@/lib/services/notification-delivery-service", () => ({
  listDeliverableNotificationEvents
}));

describe("notification delivery debug route", () => {
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
      "../../app/api/internal/debug/notification-delivery/route"
    );

    const response = await GET(
      new Request("http://localhost/api/internal/debug/notification-delivery") as never
    );

    expect(response.status).toBe(403);
  });

  it("returns delivery-ready events for authorized requests", async () => {
    listDeliverableNotificationEvents.mockResolvedValue([{ id: "event-1" }]);
    const { GET } = await import(
      "../../app/api/internal/debug/notification-delivery/route"
    );

    const response = await GET(
      new Request(
        "http://localhost/api/internal/debug/notification-delivery?limit=12&userId=viewer-1&channel=inapp",
        {
          headers: {
            "x-cron-secret": "test-secret"
          }
        }
      ) as never
    );

    expect(listDeliverableNotificationEvents).toHaveBeenCalledWith({
      limit: 12,
      userId: "viewer-1",
      channel: "inapp"
    });
    expect(response.status).toBe(200);
  });
});
