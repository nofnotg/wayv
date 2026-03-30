import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { buildBaseNotificationSenderPayload } from "@/lib/services/notification-sender-contract";

export const emailNoopSenderAdapter: NotificationSenderAdapter = {
  adapterKey: "noop-email",
  channel: "email",
  providerKey: "email-noop",
  mode: "noop",
  buildPayload(event, claimToken) {
    const payload = buildBaseNotificationSenderPayload(event, claimToken);
    payload.recipient.address = `${event.userId}@pending.local`;
    return payload;
  },
  async previewSend(item) {
    return {
      accepted: true,
      channel: "email",
      adapterKey: "noop-email",
      providerKey: "email-noop",
      senderMode: "noop",
      externalMessageId: `email-preview:${item.event.id}`,
      retryCategory: null,
      providerStatusCode: "preview-ok",
      payload: item.payload
    };
  }
};
