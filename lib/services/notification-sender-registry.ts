import type {
  NotificationChannel,
  NotificationSenderRegistryEntry
} from "@/lib/domain/types";
import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { emailNoopSenderAdapter } from "@/lib/services/notification-senders/email-noop-sender";
import { inappNoopSenderAdapter } from "@/lib/services/notification-senders/inapp-noop-sender";
import { pushNoopSenderAdapter } from "@/lib/services/notification-senders/push-noop-sender";

type NotificationSenderRegistryRecord = NotificationSenderRegistryEntry & {
  adapter: NotificationSenderAdapter;
};

const senderRegistry: Record<NotificationChannel, NotificationSenderRegistryRecord> = {
  inapp: {
    channel: "inapp",
    mode: "noop",
    futureProviderKey: "inapp-store",
    adapter: inappNoopSenderAdapter
  },
  email: {
    channel: "email",
    mode: "noop",
    futureProviderKey: "email-provider",
    adapter: emailNoopSenderAdapter
  },
  push: {
    channel: "push",
    mode: "noop",
    futureProviderKey: "push-provider",
    adapter: pushNoopSenderAdapter
  }
};

export function getNotificationSenderRegistryEntry(channel: NotificationChannel) {
  return senderRegistry[channel];
}

export function listNotificationSenderRegistryEntries() {
  return Object.values(senderRegistry).map(({ adapter: _adapter, ...entry }) => entry);
}
