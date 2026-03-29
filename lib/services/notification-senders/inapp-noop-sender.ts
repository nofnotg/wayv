import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { buildBaseNotificationSenderPayload } from "@/lib/services/notification-sender-contract";

export const inappNoopSenderAdapter: NotificationSenderAdapter = {
  adapterKey: "noop-inapp",
  channel: "inapp",
  buildPayload(event, claimToken) {
    return buildBaseNotificationSenderPayload(event, claimToken);
  },
  async previewSend(item) {
    return {
      accepted: true,
      channel: "inapp",
      adapterKey: "noop-inapp",
      payload: item.payload
    };
  }
};
