import { describe, expect, it } from "vitest";

import {
  getPostModerationPresentation,
  presentCommentForViewer
} from "../../lib/services/moderation-service";

describe("moderation service", () => {
  it("hides under-review post content from non-authors", () => {
    const presentation = getPostModerationPresentation("under_review", false);

    expect(presentation.contentVisible).toBe(false);
    expect(presentation.interactionsEnabled).toBe(false);
  });

  it("softens limited comments for other viewers", () => {
    const comment = presentCommentForViewer(
      {
        id: "comment-1",
        post_id: "post-1",
        user_id: "author-1",
        body: "조금 더 강한 말이 들어 있는 댓글입니다.",
        moderation_status: "limited",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      "viewer-1"
    );

    expect(comment?.displayBody).not.toContain("강한 말");
    expect(comment?.moderationNotice).toBeTruthy();
    expect(comment?.canReport).toBe(true);
  });

  it("hides removed comments from other viewers", () => {
    const comment = presentCommentForViewer(
      {
        id: "comment-2",
        post_id: "post-1",
        user_id: "author-1",
        body: "숨겨진 댓글입니다.",
        moderation_status: "removed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      "viewer-1"
    );

    expect(comment).toBeNull();
  });
});
