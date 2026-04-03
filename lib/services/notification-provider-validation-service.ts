import type { NotificationProviderValidationEntry } from "@/lib/domain/types";
import { listNotificationSenderRegistryEntries } from "@/lib/services/notification-sender-registry";

export function listNotificationProviderValidationEntries(): NotificationProviderValidationEntry[] {
  return listNotificationSenderRegistryEntries().map((entry) => ({
    ...entry,
    safeFallbackBehavior: "noop",
    preflightReady: entry.enablement === "provider_enabled" || entry.enablement === "noop",
    preflightWarnings: [
      ...(entry.enablement === "provider_disabled" && entry.missingSecrets.length
        ? ["missing-secrets"]
        : []),
      ...(entry.enablement === "provider_disabled" && !entry.missingSecrets.length
        ? ["provider-disabled-by-flag"]
        : []),
      ...(entry.enablement === "noop" ? ["noop-only-channel"] : [])
    ],
    preflightChecks: [
      {
        key: "enablement",
        passed: entry.enablement !== "provider_disabled",
        detail:
          entry.enablement === "provider_enabled"
            ? "provider-enabled"
            : entry.enablement === "provider_disabled"
              ? "provider-disabled"
              : "noop-only"
      },
      {
        key: "secrets",
        passed: entry.providerConfigured || !entry.requiredSecrets.length,
        detail: entry.missingSecrets.length
          ? `missing:${entry.missingSecrets.join(",")}`
          : "ready"
      },
      {
        key: "fallback",
        passed: true,
        detail: "noop"
      }
    ]
  }));
}
