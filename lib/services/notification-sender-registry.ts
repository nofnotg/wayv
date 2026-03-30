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

// Each channel stays on a noop adapter until a real provider is wired in.
// When that happens, `mode`, `activeProviderKey`, and `providerReady` become the
// single staging boundary instead of leaking provider logic into the runner.
const senderRegistry: Record<NotificationChannel, NotificationSenderRegistryRecord> = {
  inapp: {
    channel: "inapp",
    mode: "noop",
    activeProviderKey: "inapp-noop",
    futureProviderKey: "inapp-store",
    providerReady: false,
    adapter: inappNoopSenderAdapter
  },
  email: {
    channel: "email",
    mode: "noop",
    activeProviderKey: "email-noop",
    futureProviderKey: "email-provider",
    providerReady: false,
    adapter: emailNoopSenderAdapter
  },
  push: {
    channel: "push",
    mode: "noop",
    activeProviderKey: "push-noop",
    futureProviderKey: "push-provider",
    providerReady: false,
    adapter: pushNoopSenderAdapter
  }
};

export function getNotificationSenderRegistryEntry(channel: NotificationChannel) {
  return senderRegistry[channel];
}

export function listNotificationSenderRegistryEntries() {
  return Object.values(senderRegistry).map(({ adapter: _adapter, ...entry }) => entry);
}
