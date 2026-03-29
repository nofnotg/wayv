import { afterEach, describe, expect, it, vi } from "vitest";

const claimDeliverableNotificationBatch = vi.fn();
const markNotificationBatchSent = vi.fn();
const markNotificationBatchFailed = vi.fn();
const markNotificationBatchRetryable = vi.fn();
const getNotificationSenderAdapter = vi.fn();
const prepareNotificationDeliveryBatchForSender = vi.fn();

vi.mock("@/lib/services/notification-delivery-service", () => ({
  NOTIFICATION_DELIVERY_MAX_ATTEMPTS: 3,
  claimDeliverableNotificationBatch,
  hasNotificationReachedMaxAttempts: (event: { attemptCount?: number }) =>
    (event.attemptCount ?? 0) >= 3,
  markNotificationBatchSent,
  markNotificationBatchFailed,
  markNotificationBatchRetryable
}));

vi.mock("@/lib/services/notification-sender-adapter", () => ({
  getNotificationSenderAdapter,
  prepareNotificationDeliveryBatchForSender
}));

describe("notification delivery runner service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("claims a batch and marks successful noop sends as sent", async () => {
    claimDeliverableNotificationBatch.mockResolvedValue({
      claimToken: "claim-1",
      claimedAt: "2026-03-29T10:00:00.000Z",
      claimExpiresAt: "2026-03-29T10:10:00.000Z",
      events: [
        {
          id: "event-1",
          userId: "viewer-1",
          channel: "inapp",
          title: "파도가 닿았어요",
          body: "조용히 이어 볼 수 있어요.",
          state: "pending",
          createdAt: "2026-03-29T09:00:00.000Z",
          attemptCount: 0
        }
      ]
    });
    const previewSend = vi.fn().mockResolvedValue({ accepted: true });
    getNotificationSenderAdapter.mockReturnValue({ previewSend });
    prepareNotificationDeliveryBatchForSender.mockReturnValue({
      claimToken: "claim-1",
      claimedAt: "2026-03-29T10:00:00.000Z",
      claimExpiresAt: "2026-03-29T10:10:00.000Z",
      items: [
        {
          event: {
            id: "event-1",
            channel: "inapp",
            attemptCount: 0
          },
          payload: {
            eventId: "event-1",
            channel: "inapp"
          }
        }
      ]
    });
    markNotificationBatchSent.mockResolvedValue([{ id: "event-1", state: "sent" }]);

    const { runNotificationDeliveryBatch } = await import(
      "../../lib/services/notification-delivery-runner-service"
    );

    const result = await runNotificationDeliveryBatch({ limit: 1 });

    expect(claimDeliverableNotificationBatch).toHaveBeenCalledWith({ limit: 1 });
    expect(previewSend).toHaveBeenCalledTimes(1);
    expect(markNotificationBatchSent).toHaveBeenCalledWith({
      eventIds: ["event-1"],
      claimToken: "claim-1"
    });
    expect(result.summary).toMatchObject({
      claimedCount: 1,
      sentCount: 1,
      failedCount: 0,
      retryableCount: 0,
      guardrailSkippedCount: 0
    });
  });

  it("marks retryable, failed, and guardrail-skipped events appropriately", async () => {
    claimDeliverableNotificationBatch.mockResolvedValue({
      claimToken: "claim-2",
      claimedAt: "2026-03-29T10:00:00.000Z",
      claimExpiresAt: "2026-03-29T10:10:00.000Z",
      events: [
        { id: "event-1", channel: "inapp", attemptCount: 3 },
        { id: "event-2", channel: "email", attemptCount: 1 },
        { id: "event-3", channel: "push", attemptCount: 1 }
      ]
    });

    const retryableError = Object.assign(new Error("temporary-outage"), {
      retryable: true
    });

    const previewSendInapp = vi.fn();
    const previewSendEmail = vi.fn().mockRejectedValue(retryableError);
    const previewSendPush = vi.fn().mockRejectedValue(new Error("hard-failure"));

    getNotificationSenderAdapter.mockImplementation((channel: string) => {
      if (channel === "inapp") {
        return { previewSend: previewSendInapp };
      }

      if (channel === "email") {
        return { previewSend: previewSendEmail };
      }

      return { previewSend: previewSendPush };
    });

    prepareNotificationDeliveryBatchForSender.mockReturnValue({
      claimToken: "claim-2",
      claimedAt: "2026-03-29T10:00:00.000Z",
      claimExpiresAt: "2026-03-29T10:10:00.000Z",
      items: [
        { event: { id: "event-1", channel: "inapp", attemptCount: 3 }, payload: {} },
        { event: { id: "event-2", channel: "email", attemptCount: 1 }, payload: {} },
        { event: { id: "event-3", channel: "push", attemptCount: 1 }, payload: {} }
      ]
    });

    const { runNotificationDeliveryBatch } = await import(
      "../../lib/services/notification-delivery-runner-service"
    );

    const result = await runNotificationDeliveryBatch({ retryAfterMinutes: 20 });

    expect(markNotificationBatchFailed).toHaveBeenCalledWith({
      eventIds: ["event-1"],
      claimToken: "claim-2",
      lastError: "max-attempts-reached:3"
    });
    expect(markNotificationBatchRetryable).toHaveBeenCalledWith({
      eventIds: ["event-2"],
      claimToken: "claim-2",
      retryAfterMinutes: 20,
      lastError: "temporary-outage"
    });
    expect(markNotificationBatchFailed).toHaveBeenCalledWith({
      eventIds: ["event-3"],
      claimToken: "claim-2",
      lastError: "hard-failure"
    });
    expect(result.results.map((item) => item.outcome)).toEqual([
      "guardrail_skipped",
      "retryable",
      "failed"
    ]);
    expect(result.summary).toMatchObject({
      claimedCount: 3,
      sentCount: 0,
      failedCount: 2,
      retryableCount: 1,
      guardrailSkippedCount: 1
    });
  });
});
