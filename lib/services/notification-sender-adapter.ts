import type {
  NotificationChannel,
  NotificationDeliveryBatch,
  NotificationEvent,
  NotificationSenderBatchItem,
  NotificationSenderPayload
} from "@/lib/domain/types";

export type NotificationSenderAdapter = {
  channel: NotificationChannel;
  buildPayload(event: NotificationEvent, claimToken: string): NotificationSenderPayload;
  previewSend(item: NotificationSenderBatchItem): Promise<{
    accepted: true;
    channel: NotificationChannel;
    payload: NotificationSenderPayload;
  }>;
};

function buildNotificationSenderPayload(
  event: NotificationEvent,
  claimToken: string
): NotificationSenderPayload {
  return {
    eventId: event.id,
    channel: event.channel,
    targetUserId: event.userId,
    title: event.title,
    body: event.body,
    postId: event.postId ?? null,
    lane: event.lane ?? null,
    claimToken
  };
}

function createNoopSenderAdapter(
  channel: NotificationChannel
): NotificationSenderAdapter {
  return {
    channel,
    buildPayload(event, claimToken) {
      return buildNotificationSenderPayload(event, claimToken);
    },
    async previewSend(item) {
      return {
        accepted: true,
        channel,
        payload: item.payload
      };
    }
  };
}

const senderAdapters: Record<NotificationChannel, NotificationSenderAdapter> = {
  inapp: createNoopSenderAdapter("inapp"),
  email: createNoopSenderAdapter("email"),
  push: createNoopSenderAdapter("push")
};

export function getNotificationSenderAdapter(channel: NotificationChannel) {
  return senderAdapters[channel];
}

export function prepareNotificationDeliveryBatchForSender(
  batch: NotificationDeliveryBatch
) {
  const items: NotificationSenderBatchItem[] = batch.events.map((event) => {
    const adapter = getNotificationSenderAdapter(event.channel);
    return {
      event,
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
