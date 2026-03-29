import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getNotificationDeliveryRunDetail = vi.fn();

vi.mock("@/lib/services/notification-delivery-attempt-log-service", () => ({
  getNotificationDeliveryRunDetail
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
    getNotificationDeliveryRunDetail.mockResolvedValue({
      run: { id: "run-1" },
      attempts: [{ id: "attempt-1" }]
    });
    const { GET } = await import(
      "../../app/api/internal/debug/notification-delivery-runs/[id]/route"
    );

    const response = await GET(
      new Request("http://localhost/api/internal/debug/notification-delivery-runs/run-1", {
        headers: {
          "x-cron-secret": "test-secret"
        }
      }) as never,
      { params: Promise.resolve({ id: "run-1" }) }
    );

    expect(getNotificationDeliveryRunDetail).toHaveBeenCalledWith("run-1");
    expect(response.status).toBe(200);
  });
});
