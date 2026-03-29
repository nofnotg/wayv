import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { buildBaseNotificationSenderPayload } from "@/lib/services/notification-sender-contract";

export const pushNoopSenderAdapter: NotificationSenderAdapter = {
  adapterKey: "noop-push",
  channel: "push",
  providerKey: "push-noop",
  buildPayload(event, claimToken) {
    const payload = buildBaseNotificationSenderPayload(event, claimToken);
    payload.recipient.deviceToken = `pending:${event.userId}`;
    return payload;
  },
  async previewSend(item) {
    return {
      accepted: true,
      channel: "push",
      adapterKey: "noop-push",
      providerKey: "push-noop",
      externalMessageId: `push-preview:${item.event.id}`,
      retryCategory: null,
      providerStatusCode: "preview-ok",
      payload: item.payload
    };
  }
};
