import { describe, expect, it } from "vitest";

import type {
  NotificationCandidate,
  NotificationPreference,
  RestModeSetting
} from "../../lib/domain/types";
import {
  decideNotificationEvent,
  isWithinQuietHours
} from "../../lib/services/notification-event-service";

const baseCandidate: NotificationCandidate = {
  userId: "viewer-1",
  type: "for_you_wave",
  lane: "for_you",
  title: "지금 닿을 만한 파도",
  body: "한 번 더 천천히 읽어 보고 싶은 파도예요.",
  postId: "post-1",
  waveState: "spreading",
  createdAt: "2026-03-29T08:00:00.000Z"
};

const basePreference: NotificationPreference = {
  userId: "viewer-1",
  enabled: true,
  digestMode: "normal",
  quietHoursStart: null,
  quietHoursEnd: null,
  maxDailyNotifications: 2
};

describe("notification event service", () => {
  it("suppresses a normal candidate while rest mode is enabled", () => {
    const restMode: RestModeSetting = {
      userId: "viewer-1",
      enabled: true,
      startedAt: "2026-03-29T08:00:00.000Z",
      endsAt: null,
      allowOperationalNotifications: true
    };

    const decision = decideNotificationEvent({
      candidate: baseCandidate,
      preference: basePreference,
      restMode,
      recentEvents: []
    });

    expect(decision.state).toBe("suppressed");
    expect(decision.suppressionReason).toBe("rest_mode");
  });

  it("allows operational candidates during rest mode when exceptions are allowed", () => {
    const restMode: RestModeSetting = {
      userId: "viewer-1",
      enabled: true,
      startedAt: "2026-03-29T08:00:00.000Z",
      endsAt: null,
      allowOperationalNotifications: true
    };

    const decision = decideNotificationEvent({
      candidate: {
        ...baseCandidate,
        type: "operational_notice",
        lane: "operational",
        postId: null
      },
      preference: {
        ...basePreference,
        enabled: false,
        digestMode: "off"
      },
      restMode,
      recentEvents: []
    });

    expect(decision.state).toBe("operational_only");
    expect(decision.suppressionReason).toBeNull();
  });

  it("marks a recent duplicate inside the unsafe window", () => {
    const decision = decideNotificationEvent({
      candidate: baseCandidate,
      preference: basePreference,
      restMode: null,
      recentEvents: [
        {
          state: "pending",
          dedupe_key: "viewer-1:for_you_wave:post-1:for_you",
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        }
      ]
    });

    expect(decision.state).toBe("skipped_duplicate");
    expect(decision.suppressionReason).toBe("duplicate_window");
  });

  it("suppresses candidates during quiet hours", () => {
    const preference: NotificationPreference = {
      ...basePreference,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00"
    };

    expect(isWithinQuietHours(preference, new Date("2026-03-29T22:30:00"))).toBe(true);

    const decision = decideNotificationEvent({
      candidate: baseCandidate,
      preference,
      restMode: null,
      recentEvents: [],
      now: new Date("2026-03-29T22:30:00")
    });

    expect(decision.state).toBe("suppressed");
    expect(decision.suppressionReason).toBe("quiet_hours");
  });
});
