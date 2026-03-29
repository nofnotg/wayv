import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const claimDeliverableNotificationBatch = vi.fn();
const markNotificationBatchSent = vi.fn();
const markNotificationBatchFailed = vi.fn();
const markNotificationBatchRetryable = vi.fn();

vi.mock("@/lib/services/notification-delivery-service", () => ({
  claimDeliverableNotificationBatch,
  markNotificationBatchSent,
  markNotificationBatchFailed,
  markNotificationBatchRetryable
}));

describe("notification delivery worker routes", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = previousSecret;
  });

  it("protects the delivery batch claim route", async () => {
    const { POST } = await import("../../app/api/internal/delivery/batch/route");

    const unauthorized = await POST(
      new Request("http://localhost/api/internal/delivery/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 5 })
      }) as never
    );

    expect(unauthorized.status).toBe(403);
  });

  it("claims a sender-facing batch for authorized internal requests", async () => {
    claimDeliverableNotificationBatch.mockResolvedValue({
      claimToken: "claim-1",
      claimedAt: "2026-03-29T10:00:00.000Z",
      claimExpiresAt: "2026-03-29T10:10:00.000Z",
      events: [{ id: "event-1" }]
    });
    const { POST } = await import("../../app/api/internal/delivery/batch/route");

    const response = await POST(
      new Request("http://localhost/api/internal/delivery/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "test-secret"
        },
        body: JSON.stringify({ limit: 5, claimTtlMinutes: 12 })
      }) as never
    );

    expect(claimDeliverableNotificationBatch).toHaveBeenCalledWith({
      limit: 5,
      claimTtlMinutes: 12
    });
    expect(response.status).toBe(200);
  });

  it("routes sent and retryable delivery outcomes to the correct service", async () => {
    markNotificationBatchSent.mockResolvedValue([{ id: "event-1", state: "sent" }]);
    markNotificationBatchRetryable.mockResolvedValue([
      { id: "event-2", state: "retryable" }
    ]);
    const { POST } = await import("../../app/api/internal/delivery/outcomes/route");

    const sentResponse = await POST(
      new Request("http://localhost/api/internal/delivery/outcomes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "test-secret"
        },
        body: JSON.stringify({
          outcome: "sent",
          claimToken: "11111111-1111-4111-8111-111111111111",
          eventIds: ["22222222-2222-4222-8222-222222222222"]
        })
      }) as never
    );

    expect(markNotificationBatchSent).toHaveBeenCalledWith({
      outcome: "sent",
      claimToken: "11111111-1111-4111-8111-111111111111",
      eventIds: ["22222222-2222-4222-8222-222222222222"]
    });
    expect(sentResponse.status).toBe(200);

    const retryResponse = await POST(
      new Request("http://localhost/api/internal/delivery/outcomes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "test-secret"
        },
        body: JSON.stringify({
          outcome: "retryable",
          claimToken: "11111111-1111-4111-8111-111111111111",
          retryAfterMinutes: 30,
          lastError: "provider-timeout",
          eventIds: ["33333333-3333-4333-8333-333333333333"]
        })
      }) as never
    );

    expect(markNotificationBatchRetryable).toHaveBeenCalledWith({
      outcome: "retryable",
      claimToken: "11111111-1111-4111-8111-111111111111",
      retryAfterMinutes: 30,
      lastError: "provider-timeout",
      eventIds: ["33333333-3333-4333-8333-333333333333"]
    });
    expect(retryResponse.status).toBe(200);
  });
});
