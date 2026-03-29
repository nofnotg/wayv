import type {
  NotificationChannel,
  NotificationDeliveryBatch,
  NotificationSenderBatch,
  NotificationSenderBatchItem
} from "@/lib/domain/types";
import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { emailNoopSenderAdapter } from "@/lib/services/notification-senders/email-noop-sender";
import { inappNoopSenderAdapter } from "@/lib/services/notification-senders/inapp-noop-sender";
import { pushNoopSenderAdapter } from "@/lib/services/notification-senders/push-noop-sender";

const senderAdapters: Record<NotificationChannel, NotificationSenderAdapter> = {
  inapp: inappNoopSenderAdapter,
  email: emailNoopSenderAdapter,
  push: pushNoopSenderAdapter
};

export function getNotificationSenderAdapter(channel: NotificationChannel) {
  return senderAdapters[channel];
}

export function prepareNotificationDeliveryBatchForSender(
  batch: NotificationDeliveryBatch
): NotificationSenderBatch {
  const items: NotificationSenderBatchItem[] = batch.events.map((event) => {
    const adapter = getNotificationSenderAdapter(event.channel);
    return {
      event,
      adapterKey: adapter.adapterKey,
      providerKey: adapter.providerKey,
      payload: adapter.buildPayload(event, batch.claimToken)
    };
  });

  return {
    claimToken: batch.claimToken,
    claimedAt: batch.claimedAt,
    claimExpiresAt: batch.claimExpiresAt,
    items
  };
}
