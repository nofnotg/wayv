import { describe, expect, it } from "vitest";

import type { RestModeSetting, WavePost } from "../../lib/domain/types";
import { buildHomeLanes, buildViewerSignalProfile } from "../../lib/services/feed-service";

let postId = 0;

function createPost(overrides: Partial<WavePost>): WavePost {
  return {
    id: overrides.id ?? `post-${++postId}`,
    authorId: overrides.authorId ?? "author-1",
    title: overrides.title ?? "파도 제목",
    body: overrides.body ?? "스무 글자를 넘는 파도 본문이 충분히 담겨 있어요.",
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

describe("feed service", () => {
  it("prioritizes posts close to authored and reacted signals", () => {
    const authored = createPost({
      id: "authored",
      categories: ["relationships"],
      emotionTags: ["grief"],
      state: "lingering"
    });
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

    const signalProfile = buildViewerSignalProfile({
      authoredPosts: [authored],
      reactedPosts: [{ reactionType: "me_too", post: authored }],
      commentedPosts: [],
      seedProfile: null
    });

    const lanes = buildHomeLanes({
      posts: [distant, matching],
      signalProfile,
      seedProfile: null,
      restMode: null
    });

    expect(lanes.for_you[0]?.id).toBe("matching");
  });

  it("suppresses the personal lane while rest mode is enabled", () => {
    const post = createPost({ id: "rest-post", state: "rekindled" });
    const signalProfile = buildViewerSignalProfile({
      authoredPosts: [],
      reactedPosts: [],
      commentedPosts: [],
      seedProfile: null
    });
    const restMode: RestModeSetting = {
      userId: "viewer-1",
      enabled: true,
      startedAt: new Date().toISOString(),
      endsAt: null,
      allowOperationalNotifications: true
    };

    const lanes = buildHomeLanes({
      posts: [post],
      signalProfile,
      seedProfile: null,
      restMode
    });

    expect(lanes.for_you).toEqual([]);
    expect(lanes.rekindled[0]?.id).toBe("rest-post");
  });
});
