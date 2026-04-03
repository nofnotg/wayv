import type { NotificationProviderValidationEntry } from "@/lib/domain/types";
import { listNotificationSenderRegistryEntries } from "@/lib/services/notification-sender-registry";

export function listNotificationProviderValidationEntries(): NotificationProviderValidationEntry[] {
  return listNotificationSenderRegistryEntries().map((entry) => ({
    ...entry,
    safeFallbackBehavior: "noop"
  }));
}
