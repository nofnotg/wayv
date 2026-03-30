import type {
  NotificationChannel,
  NotificationDeliveryBatch,
  NotificationSenderBatch,
  NotificationSenderBatchItem
} from "@/lib/domain/types";
import { getNotificationSenderRegistryEntry } from "@/lib/services/notification-sender-registry";

export function getNotificationSenderAdapter(channel: NotificationChannel) {
  return getNotificationSenderRegistryEntry(channel).adapter;
}

export function prepareNotificationDeliveryBatchForSender(
  batch: NotificationDeliveryBatch
): NotificationSenderBatch {
  const items: NotificationSenderBatchItem[] = batch.events.map((event) => {
    const registryEntry = getNotificationSenderRegistryEntry(event.channel);
    const adapter = registryEntry.adapter;
    return {
      event,
      adapterKey: adapter.adapterKey,
      providerKey: adapter.providerKey,
      senderMode: registryEntry.mode,
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
