import { describe, expect, it } from "vitest";

import {
  buildNotificationDeliveryAnalytics,
  filterNotificationDeliveryEventsByScope
} from "../../lib/services/notification-delivery-analytics-service";

const events = [
  {
    id: "1",
    userId: "viewer-1",
    type: "for_you_wave" as const,
    channel: "inapp" as const,
    lane: "for_you" as const,
    postId: "post-1",
    title: "준비된 파도",
    body: "곧 보낼 수 있어요.",
    state: "pending" as const,
    createdAt: "2026-03-29T08:00:00.000Z",
    attemptCount: 0,
    sentAt: null,
    readAt: null
  },
  {
    id: "2",
    userId: "viewer-1",
    type: "for_you_wave" as const,
    channel: "inapp" as const,
    lane: "for_you" as const,
    postId: "post-2",
    title: "잡힌 파도",
    body: "지금 worker가 보고 있어요.",
    state: "pending" as const,
    claimToken: "claim-1",
    claimExpiresAt: "2999-01-01T00:00:00.000Z",
    createdAt: "2026-03-29T08:10:00.000Z",
    attemptCount: 1,
    sentAt: null,
    readAt: null
  },
  {
    id: "3",
    userId: "viewer-1",
    type: "for_you_wave" as const,
    channel: "inapp" as const,
    lane: "for_you" as const,
    postId: "post-3",
    title: "만료된 클레임",
    body: "다시 확인이 필요해요.",
    state: "retryable" as const,
    claimToken: "claim-2",
    claimExpiresAt: "2020-01-01T00:00:00.000Z",
    createdAt: "2026-03-29T08:20:00.000Z",
    attemptCount: 2,
    sentAt: null,
    readAt: null,
    lastAttemptAt: "2026-03-29T08:30:00.000Z"
  },
  {
    id: "4",
    userId: "viewer-1",
    type: "for_you_wave" as const,
    channel: "inapp" as const,
    lane: "for_you" as const,
    postId: "post-4",
    title: "전달된 파도",
    body: "이미 닿았어요.",
    state: "sent" as const,
    createdAt: "2026-03-29T08:40:00.000Z",
    attemptCount: 1,
    sentAt: "2026-03-29T08:41:00.000Z",
    readAt: null,
    lastAttemptAt: "2026-03-29T08:41:00.000Z"
  },
  {
    id: "5",
    userId: "viewer-1",
    type: "for_you_wave" as const,
    channel: "inapp" as const,
    lane: "for_you" as const,
    postId: "post-5",
    title: "실패한 파도",
    body: "다시 볼 필요가 있어요.",
    state: "failed" as const,
    createdAt: "2026-03-29T08:50:00.000Z",
    attemptCount: 3,
    sentAt: null,
    readAt: null,
    lastAttemptAt: "2026-03-29T08:55:00.000Z"
  }
];

describe("notification delivery analytics", () => {
  it("filters claimed and retryable scopes correctly", () => {
    expect(filterNotificationDeliveryEventsByScope(events, "claimed")).toHaveLength(1);
    expect(filterNotificationDeliveryEventsByScope(events, "expired_claims")).toHaveLength(1);
    expect(filterNotificationDeliveryEventsByScope(events, "retryable_backlog")).toHaveLength(1);
  });

  it("builds lightweight delivery analytics", () => {
    const analytics = buildNotificationDeliveryAnalytics(events);

    expect(analytics).toMatchObject({
      readyCount: 1,
      claimedCount: 1,
      expiredClaimCount: 1,
      sentCount: 1,
      failedCount: 1,
      retryableCount: 1
    });
    expect(analytics.latestAttemptAt).toBe("2026-03-29T08:55:00.000Z");
    expect(analytics.averageAttemptCount).toBeGreaterThan(1);
  });
});
