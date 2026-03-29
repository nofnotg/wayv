import type {
  NotificationChannel,
  NotificationDeliveryBatch,
  NotificationEvent,
  NotificationSenderBatch,
  NotificationSenderBatchItem,
  NotificationSenderPayload,
  NotificationSenderPreviewResult
} from "@/lib/domain/types";

export type NotificationSenderAdapter = {
  adapterKey: string;
  channel: NotificationChannel;
  buildPayload(event: NotificationEvent, claimToken: string): NotificationSenderPayload;
  previewSend(item: NotificationSenderBatchItem): Promise<NotificationSenderPreviewResult>;
};

function buildBasePayload(
  event: NotificationEvent,
  claimToken: string
): NotificationSenderPayload {
  return {
    channel: event.channel,
    recipient: {
      userId: event.userId,
      address: null,
      deviceToken: null
    },
    content: {
      title: event.title,
      body: event.body
    },
    context: {
      eventId: event.id,
      eventType: event.type,
      postId: event.postId ?? null,
      lane: event.lane ?? null,
      claimToken
    }
  };
}

function createNoopSenderAdapter(
  channel: NotificationChannel,
  adapterKey: string
): NotificationSenderAdapter {
  return {
    adapterKey,
    channel,
    buildPayload(event, claimToken) {
      const payload = buildBasePayload(event, claimToken);

      if (channel === "email") {
        payload.recipient.address = `${event.userId}@pending.local`;
      }

      if (channel === "push") {
        payload.recipient.deviceToken = `pending:${event.userId}`;
      }

      return payload;
    },
    async previewSend(item) {
      return {
        accepted: true,
        channel,
        adapterKey,
        payload: item.payload
      };
    }
  };
}

const senderAdapters: Record<NotificationChannel, NotificationSenderAdapter> = {
  inapp: createNoopSenderAdapter("inapp", "noop-inapp"),
  email: createNoopSenderAdapter("email", "noop-email"),
  push: createNoopSenderAdapter("push", "noop-push")
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
