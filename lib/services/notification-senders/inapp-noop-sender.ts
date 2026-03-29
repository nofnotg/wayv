import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { buildBaseNotificationSenderPayload } from "@/lib/services/notification-sender-contract";

export const inappNoopSenderAdapter: NotificationSenderAdapter = {
  adapterKey: "noop-inapp",
  channel: "inapp",
  providerKey: "inapp-noop",
  buildPayload(event, claimToken) {
    return buildBaseNotificationSenderPayload(event, claimToken);
  },
  async previewSend(item) {
    return {
      accepted: true,
      channel: "inapp",
      adapterKey: "noop-inapp",
      providerKey: "inapp-noop",
      externalMessageId: `inapp-preview:${item.event.id}`,
      retryCategory: null,
      providerStatusCode: "preview-ok",
      payload: item.payload
    };
  }
};
