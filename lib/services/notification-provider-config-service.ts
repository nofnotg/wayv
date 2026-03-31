import type { NotificationChannel } from "@/lib/domain/types";

type NotificationProviderConfigState = {
  channel: NotificationChannel;
  requiredSecrets: string[];
  missingSecrets: string[];
  providerConfigured: boolean;
};

function getRequiredSecrets(channel: NotificationChannel) {
  switch (channel) {
    case "email":
      return ["WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET"];
    case "push":
      return ["WAYV_NOTIFICATION_PUSH_PROVIDER_SECRET"];
    default:
      return [] as string[];
  }
}

export function getNotificationProviderConfigState(
  channel: NotificationChannel
): NotificationProviderConfigState {
  const requiredSecrets = getRequiredSecrets(channel);
  const missingSecrets = requiredSecrets.filter((envKey) => !process.env[envKey]?.trim());

  return {
    channel,
    requiredSecrets,
    missingSecrets,
    providerConfigured: requiredSecrets.length === 0 || missingSecrets.length === 0
  };
}
