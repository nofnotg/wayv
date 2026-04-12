import { afterEach, describe, expect, it, vi } from "vitest";

const submitModerationFeedback = vi.fn();
const getViewerContext = vi.fn();

vi.mock("@/lib/services/moderation-feedback-service", () => ({
  submitModerationFeedback
}));

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

describe("moderation feedback route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires auth for moderation feedback submission", async () => {
    getViewerContext.mockResolvedValue(null);

    const { POST } = await import("../../app/api/moderation-feedback/route");
    const response = await POST(
      new Request("http://localhost/api/moderation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "comment_body",
          action: "soft_hold",
          reasons: ["ridicule_or_mockery"],
          choice: "felt_too_strict"
        })
      }) as never
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("blocks pending viewers from moderation feedback submission", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "pending" } });

    const { POST } = await import("../../app/api/moderation-feedback/route");
    const response = await POST(
      new Request("http://localhost/api/moderation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "comment_body",
          action: "soft_hold",
          reasons: ["ridicule_or_mockery"],
          choice: "felt_too_strict"
        })
      }) as never
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "beta-access-denied",
      status: "pending",
      applicationRequired: false
    });
  });

  it("submits moderation feedback for approved viewers", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    submitModerationFeedback.mockResolvedValue({ id: "feedback-1", choice: "understood" });

    const { POST } = await import("../../app/api/moderation-feedback/route");
    const response = await POST(
      new Request("http://localhost/api/moderation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "post_body",
          targetId: "11111111-1111-1111-1111-111111111111",
          action: "allow_with_guidance",
          reasons: ["unsolicited_advice"],
          guidanceFamily: "advice_or_preaching",
          choice: "understood",
          freeText: "방향은 이해됐어요",
          path: "/wave/post-1",
          retryAttempted: false,
          retrySucceeded: true
        })
      }) as never
    );

    expect(submitModerationFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "post_body",
        action: "allow_with_guidance",
        choice: "understood"
      }),
      "viewer-1"
    );
    expect(response.status).toBe(201);
  });
});
