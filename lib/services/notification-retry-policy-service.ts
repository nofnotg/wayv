import type {
  NotificationChannel,
  NotificationRetryPolicyDecision
} from "@/lib/domain/types";
import { NOTIFICATION_DELIVERY_MAX_ATTEMPTS } from "@/lib/services/notification-delivery-service";

const retryPolicyMatrix: Record<NotificationChannel, number[]> = {
  inapp: [5, 15, 60],
  email: [15, 60, 180],
  push: [10, 30, 120]
};

export function resolveNotificationRetryPolicy(input: {
  channel: NotificationChannel;
  attemptCount: number;
}): NotificationRetryPolicyDecision {
  const delays = retryPolicyMatrix[input.channel];
  const index = Math.min(Math.max(input.attemptCount, 0), delays.length - 1);

  return {
    retryAfterMinutes: delays[index],
    maxAttempts: NOTIFICATION_DELIVERY_MAX_ATTEMPTS
  };
}
