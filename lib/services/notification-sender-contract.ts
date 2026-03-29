import type {
  NotificationChannel,
  NotificationEvent,
  NotificationSenderBatchItem,
  NotificationSenderPayload,
  NotificationSenderPreviewResult
} from "@/lib/domain/types";

export type NotificationSenderAdapter = {
  adapterKey: string;
  channel: NotificationChannel;
  providerKey: string;
  buildPayload(event: NotificationEvent, claimToken: string): NotificationSenderPayload;
  previewSend(item: NotificationSenderBatchItem): Promise<NotificationSenderPreviewResult>;
};

export function buildBaseNotificationSenderPayload(
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
