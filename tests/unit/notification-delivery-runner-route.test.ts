import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runNotificationDeliveryBatch = vi.fn();
const requeueNotificationDeliveryEvents = vi.fn();
const releaseExpiredNotificationClaims = vi.fn();

vi.mock("@/lib/services/notification-delivery-runner-service", () => ({
  runNotificationDeliveryBatch
}));

vi.mock("@/lib/services/notification-delivery-service", () => ({
  requeueNotificationDeliveryEvents,
  releaseExpiredNotificationClaims
}));

describe("notification delivery runner and control routes", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = previousSecret;
  });

  it("runs one internal batch with the validated payload", async () => {
    runNotificationDeliveryBatch.mockResolvedValue({
      batch: {
        claimToken: "claim-1",
        claimedAt: "2026-03-29T10:00:00.000Z",
        claimExpiresAt: "2026-03-29T10:10:00.000Z",
        claimedCount: 2
      },
      results: [],
      summary: {
        claimToken: "claim-1",
        ranAt: "2026-03-29T10:00:00.000Z",
        claimedCount: 2,
        sentCount: 2,
        failedCount: 0,
        retryableCount: 0,
        guardrailSkippedCount: 0,
        emptyBatch: false
      },
      run: {
        id: "run-1",
        claimToken: "claim-1",
        ranAt: "2026-03-29T10:00:00.000Z",
        requestedLimit: 4,
        claimedCount: 2,
        sentCount: 2,
        failedCount: 0,
        retryableCount: 0,
        guardrailSkippedCount: 0
      }
    });
    const { POST } = await import("../../app/api/internal/delivery/run-batch/route");

    const response = await POST(
      new Request("http://localhost/api/internal/delivery/run-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "test-secret"
        },
        body: JSON.stringify({
          limit: 4,
          claimTtlMinutes: 12,
          retryAfterMinutes: 30
        })
      }) as never
    );

    expect(runNotificationDeliveryBatch).toHaveBeenCalledWith({
      limit: 4,
      claimTtlMinutes: 12,
      retryAfterMinutes: 30
    });
    expect(response.status).toBe(200);
  });

  it("requeues retryable or failed events through the control route", async () => {
    requeueNotificationDeliveryEvents.mockResolvedValue({
      action: "requeue",
      updated: [{ id: "event-1", state: "pending" }],
      skipped: []
    });
    const { POST } = await import("../../app/api/internal/delivery/control/route");

    const response = await POST(
      new Request("http://localhost/api/internal/delivery/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "test-secret"
        },
        body: JSON.stringify({
          action: "requeue",
          eventIds: ["11111111-1111-4111-8111-111111111111"]
        })
      }) as never
    );

    expect(requeueNotificationDeliveryEvents).toHaveBeenCalledWith({
      action: "requeue",
      eventIds: ["11111111-1111-4111-8111-111111111111"]
    });
    expect(response.status).toBe(200);
  });

  it("releases expired claims through the control route", async () => {
    releaseExpiredNotificationClaims.mockResolvedValue({
      action: "release_expired_claim",
      updated: [{ id: "event-2", claimToken: null }],
      skipped: []
    });
    const { POST } = await import("../../app/api/internal/delivery/control/route");

    const response = await POST(
      new Request("http://localhost/api/internal/delivery/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "test-secret"
        },
        body: JSON.stringify({
          action: "release_expired_claim",
          eventIds: ["22222222-2222-4222-8222-222222222222"]
        })
      }) as never
    );

    expect(releaseExpiredNotificationClaims).toHaveBeenCalledWith({
      action: "release_expired_claim",
      eventIds: ["22222222-2222-4222-8222-222222222222"]
    });
    expect(response.status).toBe(200);
  });

  it("protects the new internal routes", async () => {
    const runBatchRoute = await import("../../app/api/internal/delivery/run-batch/route");
    const controlRoute = await import("../../app/api/internal/delivery/control/route");

    const runResponse = await runBatchRoute.POST(
      new Request("http://localhost/api/internal/delivery/run-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }) as never
    );
    const controlResponse = await controlRoute.POST(
      new Request("http://localhost/api/internal/delivery/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "requeue",
          eventIds: ["11111111-1111-4111-8111-111111111111"]
        })
      }) as never
    );

    expect(runResponse.status).toBe(403);
    expect(controlResponse.status).toBe(403);
  });
});
