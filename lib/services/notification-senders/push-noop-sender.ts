import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { buildBaseNotificationSenderPayload } from "@/lib/services/notification-sender-contract";

export const pushNoopSenderAdapter: NotificationSenderAdapter = {
  adapterKey: "noop-push",
  channel: "push",
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
      payload: item.payload
    };
  }
};
