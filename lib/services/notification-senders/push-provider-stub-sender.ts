import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { buildBaseNotificationSenderPayload } from "@/lib/services/notification-sender-contract";

export const pushProviderStubSenderAdapter: NotificationSenderAdapter = {
  adapterKey: "provider-stub-push",
  channel: "push",
  providerKey: "push-provider",
  mode: "provider",
  buildPayload(event, claimToken) {
    const payload = buildBaseNotificationSenderPayload(event, claimToken);
    payload.recipient.deviceToken = `pending:${event.userId}`;
    return payload;
  },
  async previewSend(item) {
    return {
      accepted: true,
      channel: "push",
      adapterKey: "provider-stub-push",
      providerKey: "push-provider",
      senderMode: "provider",
      externalMessageId: `push-provider-preview:${item.event.id}`,
      retryCategory: null,
      providerStatusCode: "stub-ready",
      payload: item.payload
    };
  }
};
