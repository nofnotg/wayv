import { describe, expect, it } from "vitest";

import { getNotificationSenderAdapter, prepareNotificationDeliveryBatchForSender } from "../../lib/services/notification-sender-adapter";

describe("notification sender adapter", () => {
  it("selects a noop adapter for each supported channel", () => {
    expect(getNotificationSenderAdapter("inapp").channel).toBe("inapp");
    expect(getNotificationSenderAdapter("email").channel).toBe("email");
    expect(getNotificationSenderAdapter("push").channel).toBe("push");
  });

  it("maps a claimed batch into sender payloads", () => {
    const senderBatch = prepareNotificationDeliveryBatchForSender({
      claimToken: "11111111-1111-4111-8111-111111111111",
      claimedAt: "2026-03-29T10:00:00.000Z",
      claimExpiresAt: "2026-03-29T10:10:00.000Z",
      events: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          userId: "viewer-1",
          type: "for_you_wave",
          channel: "inapp",
          lane: "for_you",
          postId: "post-1",
          title: "지금 닿을 만한 파도",
          body: "조용히 이어지는 결이 있어요.",
          state: "pending",
          createdAt: "2026-03-29T09:00:00.000Z",
          claimToken: "11111111-1111-4111-8111-111111111111",
          claimedAt: "2026-03-29T10:00:00.000Z",
          claimExpiresAt: "2026-03-29T10:10:00.000Z",
          attemptCount: 0,
          sentAt: null,
          readAt: null
        }
      ]
    });

    expect(senderBatch.items).toHaveLength(1);
    expect(senderBatch.items[0].payload).toMatchObject({
      eventId: "22222222-2222-4222-8222-222222222222",
      channel: "inapp",
      targetUserId: "viewer-1",
      postId: "post-1",
      claimToken: "11111111-1111-4111-8111-111111111111"
    });
  });
});
