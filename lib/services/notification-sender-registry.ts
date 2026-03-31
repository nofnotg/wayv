import type {
  NotificationChannel,
  NotificationSenderRegistryEntry
} from "@/lib/domain/types";
import type { NotificationSenderAdapter } from "@/lib/services/notification-sender-contract";
import { emailProviderStubSenderAdapter } from "@/lib/services/notification-senders/email-provider-stub-sender";
import { emailNoopSenderAdapter } from "@/lib/services/notification-senders/email-noop-sender";
import { inappNoopSenderAdapter } from "@/lib/services/notification-senders/inapp-noop-sender";
import { pushProviderStubSenderAdapter } from "@/lib/services/notification-senders/push-provider-stub-sender";
import { pushNoopSenderAdapter } from "@/lib/services/notification-senders/push-noop-sender";

type NotificationSenderRegistryRecord = NotificationSenderRegistryEntry & {
  adapter: NotificationSenderAdapter;
};

type NotificationSenderRegistryBase = {
  noopAdapter: NotificationSenderAdapter;
  providerAdapter: NotificationSenderAdapter | null;
  futureProviderKey: string;
};

const senderRegistryBase: Record<NotificationChannel, NotificationSenderRegistryBase> = {
  inapp: {
    noopAdapter: inappNoopSenderAdapter,
    providerAdapter: null,
    futureProviderKey: "inapp-store"
  },
  email: {
    noopAdapter: emailNoopSenderAdapter,
    providerAdapter: emailProviderStubSenderAdapter,
    futureProviderKey: "email-provider"
  },
  push: {
    noopAdapter: pushNoopSenderAdapter,
    providerAdapter: pushProviderStubSenderAdapter,
    futureProviderKey: "push-provider"
  }
};

function readEnablementFlag(channel: NotificationChannel) {
  const envKey =
    channel === "email"
      ? "WAYV_NOTIFICATION_EMAIL_PROVIDER_ENABLED"
      : channel === "push"
        ? "WAYV_NOTIFICATION_PUSH_PROVIDER_ENABLED"
        : null;

  if (!envKey) {
    return false;
  }

  return process.env[envKey]?.toLowerCase() === "true";
}

// Each channel can stay noop-only, expose a provider-ready slot, or switch into
// provider mode later without changing the runner contract.
export function getNotificationSenderRegistryEntry(channel: NotificationChannel) {
  const base = senderRegistryBase[channel];
  const providerRequested = readEnablementFlag(channel);
  const providerReady = Boolean(base.providerAdapter);

  if (providerRequested && providerReady && base.providerAdapter) {
    return {
      channel,
      enablement: "provider_enabled" as const,
      mode: base.providerAdapter.mode,
      activeProviderKey: base.providerAdapter.providerKey,
      futureProviderKey: base.futureProviderKey,
      providerReady,
      adapter: base.providerAdapter
    };
  }

  if (providerReady) {
    return {
      channel,
      enablement: "provider_disabled" as const,
      mode: base.noopAdapter.mode,
      activeProviderKey: base.noopAdapter.providerKey,
      futureProviderKey: base.futureProviderKey,
      providerReady,
      adapter: base.noopAdapter
    };
  }

  return {
    channel,
    enablement: "noop" as const,
    mode: base.noopAdapter.mode,
    activeProviderKey: base.noopAdapter.providerKey,
    futureProviderKey: base.futureProviderKey,
    providerReady,
    adapter: base.noopAdapter
  };
}

export function listNotificationSenderRegistryEntries() {
  return (Object.keys(senderRegistryBase) as NotificationChannel[]).map((channel) => {
    const { adapter: _adapter, ...entry } = getNotificationSenderRegistryEntry(channel);
    return entry;
  });
}
