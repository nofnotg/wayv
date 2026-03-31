import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { buildBaseNotificationSenderPayload } from "@/lib/services/notification-sender-contract";

export const emailProviderStubSenderAdapter: NotificationSenderAdapter = {
  adapterKey: "provider-stub-email",
  channel: "email",
  providerKey: "email-provider",
  mode: "provider",
  buildPayload(event, claimToken) {
    const payload = buildBaseNotificationSenderPayload(event, claimToken);
    payload.recipient.address = `${event.userId}@pending.local`;
    return payload;
  },
  async previewSend(item) {
    return {
      accepted: true,
      channel: "email",
      adapterKey: "provider-stub-email",
      providerKey: "email-provider",
      senderMode: "provider",
      externalMessageId: `email-provider-preview:${item.event.id}`,
      retryCategory: null,
      providerStatusCode: "stub-ready",
      payload: item.payload
    };
  }
};
