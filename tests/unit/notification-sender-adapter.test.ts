import { describe, expect, it } from "vitest";

import { getNotificationSenderAdapter, prepareNotificationDeliveryBatchForSender } from "../../lib/services/notification-sender-adapter";

describe("notification sender adapter", () => {
  it("selects a noop adapter for each supported channel", () => {
    expect(getNotificationSenderAdapter("inapp").channel).toBe("inapp");
    expect(getNotificationSenderAdapter("inapp").adapterKey).toBe("noop-inapp");
    expect(getNotificationSenderAdapter("email").channel).toBe("email");
    expect(getNotificationSenderAdapter("email").adapterKey).toBe("noop-email");
    expect(getNotificationSenderAdapter("push").channel).toBe("push");
    expect(getNotificationSenderAdapter("push").adapterKey).toBe("noop-push");
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
      channel: "inapp",
      recipient: {
        userId: "viewer-1"
      },
      content: {
        title: "지금 닿을 만한 파도"
      },
      context: {
        eventId: "22222222-2222-4222-8222-222222222222",
        postId: "post-1",
        claimToken: "11111111-1111-4111-8111-111111111111"
      }
    });
    expect(senderBatch.items[0].adapterKey).toBe("noop-inapp");
  });

  it("adds channel-specific recipient placeholders for future provider wiring", () => {
    const emailPayload = getNotificationSenderAdapter("email").buildPayload(
      {
        id: "event-email",
        userId: "viewer-2",
        type: "quiet_digest",
        channel: "email",
        lane: "quiet_digest",
        postId: null,
        title: "이메일로 남길 준비",
        body: "아직 실제 발송은 꺼져 있어요.",
        state: "pending",
        createdAt: "2026-03-29T09:00:00.000Z"
      },
      "claim-email"
    );

    const pushPayload = getNotificationSenderAdapter("push").buildPayload(
      {
        id: "event-push",
        userId: "viewer-3",
        type: "operational_notice",
        channel: "push",
        lane: "operational",
        postId: null,
        title: "푸시 준비",
        body: "장치 연결 전 자리만 잡아 둡니다.",
        state: "operational_only",
        createdAt: "2026-03-29T09:10:00.000Z"
      },
      "claim-push"
    );

    expect(emailPayload.recipient.address).toBe("viewer-2@pending.local");
    expect(pushPayload.recipient.deviceToken).toBe("pending:viewer-3");
  });
});
