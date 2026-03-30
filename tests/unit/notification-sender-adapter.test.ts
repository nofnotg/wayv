import { describe, expect, it } from "vitest";

import { getNotificationSenderAdapter, prepareNotificationDeliveryBatchForSender } from "../../lib/services/notification-sender-adapter";
import {
  getNotificationSenderRegistryEntry,
  listNotificationSenderRegistryEntries
} from "../../lib/services/notification-sender-registry";

describe("notification sender adapter", () => {
  it("selects a noop adapter for each supported channel", () => {
    expect(getNotificationSenderAdapter("inapp").channel).toBe("inapp");
    expect(getNotificationSenderAdapter("inapp").adapterKey).toBe("noop-inapp");
    expect(getNotificationSenderAdapter("email").channel).toBe("email");
    expect(getNotificationSenderAdapter("email").adapterKey).toBe("noop-email");
    expect(getNotificationSenderAdapter("push").channel).toBe("push");
    expect(getNotificationSenderAdapter("push").adapterKey).toBe("noop-push");
  });

  it("keeps a clean staging boundary between noop adapters and future providers", () => {
    expect(getNotificationSenderRegistryEntry("inapp")).toMatchObject({
      channel: "inapp",
      mode: "noop",
      activeProviderKey: "inapp-noop",
      providerReady: false,
      futureProviderKey: "inapp-store"
    });
    expect(getNotificationSenderRegistryEntry("email")).toMatchObject({
      channel: "email",
      mode: "noop",
      activeProviderKey: "email-noop",
      providerReady: false,
      futureProviderKey: "email-provider"
    });
    expect(getNotificationSenderRegistryEntry("push")).toMatchObject({
      channel: "push",
      mode: "noop",
      activeProviderKey: "push-noop",
      providerReady: false,
      futureProviderKey: "push-provider"
    });
    expect(listNotificationSenderRegistryEntries()).toHaveLength(3);
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
    expect(senderBatch.items[0].providerKey).toBe("inapp-noop");
    expect(senderBatch.items[0].senderMode).toBe("noop");
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

  it("returns provider-stub preview metadata for future sender wiring", async () => {
    const senderBatch = prepareNotificationDeliveryBatchForSender({
      claimToken: "11111111-1111-4111-8111-111111111111",
      claimedAt: "2026-03-29T10:00:00.000Z",
      claimExpiresAt: "2026-03-29T10:10:00.000Z",
      events: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          userId: "viewer-4",
          type: "quiet_digest",
          channel: "email",
          lane: "quiet_digest",
          postId: null,
          title: "이 메일은 아직 보내지 않아요",
          body: "Provider 연결 전까지는 미리보기만 남겨 둘게요.",
          state: "pending",
          createdAt: "2026-03-29T09:30:00.000Z"
        }
      ]
    });

    const preview = await getNotificationSenderAdapter("email").previewSend(senderBatch.items[0]);

    expect(preview.providerKey).toBe("email-noop");
    expect(preview.senderMode).toBe("noop");
    expect(preview.externalMessageId).toBe("email-preview:44444444-4444-4444-8444-444444444444");
    expect(preview.providerStatusCode).toBe("preview-ok");
    expect(preview.retryCategory).toBeNull();
  });
});
