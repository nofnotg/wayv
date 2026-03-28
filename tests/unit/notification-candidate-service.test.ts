import { describe, expect, it } from "vitest";

import type {
  NotificationPreference,
  OnboardingSeedProfile,
  RestModeSetting,
  WavePost
} from "../../lib/domain/types";
import { selectNotificationCandidates } from "../../lib/services/notification-candidate-service";

function createPost(overrides: Partial<WavePost>): WavePost {
  return {
    id: overrides.id ?? "post",
    authorId: overrides.authorId ?? "author-1",
    title: overrides.title ?? "파도 제목",
    body: overrides.body ?? "충분히 긴 본문으로 알림 후보를 테스트합니다.",
    categories: overrides.categories ?? ["work"],
    emotionTags: overrides.emotionTags ?? ["anxiety"],
    visibility: overrides.visibility ?? "public",
    moderationStatus: overrides.moderationStatus ?? "active",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    archivedAt: overrides.archivedAt ?? null,
    state: overrides.state ?? "spreading"
  };
}

const preference: NotificationPreference = {
  userId: "viewer-1",
  enabled: true,
  digestMode: "normal",
  quietHoursStart: null,
  quietHoursEnd: null,
  maxDailyNotifications: 2
};

const seedProfile: OnboardingSeedProfile = {
  topicWeights: { relationships: 3 },
  emotionWeights: { grief: 2 },
  preferredWaveTone: "resonant",
  exposureTolerance: "medium",
  privacyPreference: "anonymous",
  restModeAffinity: "medium",
  notificationTone: "quiet",
  readingPreference: "mixed",
  empathyPreference: "shared"
};

describe("notification candidate service", () => {
  it("suppresses proactive candidates during rest mode", () => {
    const restMode: RestModeSetting = {
      userId: "viewer-1",
      enabled: true,
      startedAt: new Date().toISOString(),
      endsAt: null,
      allowOperationalNotifications: true
    };

    const candidates = selectNotificationCandidates({
      userId: "viewer-1",
      posts: [createPost({ id: "post-1" })],
      preference,
      restMode,
      seedProfile,
      viewerSignals: { authoredPosts: [], reactedPosts: [], commentedPosts: [] }
    });

    expect(candidates).toEqual([]);
  });

  it("prioritizes wave candidates that match seed profile and state", () => {
    const matching = createPost({
      id: "matching",
      categories: ["relationships"],
      emotionTags: ["grief"],
      state: "rekindled"
    });
    const distant = createPost({
      id: "distant",
      categories: ["money"],
      emotionTags: ["relief"],
      state: "calm"
    });

    const candidates = selectNotificationCandidates({
      userId: "viewer-1",
      posts: [distant, matching],
      preference,
      restMode: null,
      seedProfile,
      viewerSignals: { authoredPosts: [], reactedPosts: [], commentedPosts: [] }
    });

    expect(candidates[0]?.postId).toBe("matching");
    expect(candidates[0]?.type).toBe("rekindled_wave");
  });
});
