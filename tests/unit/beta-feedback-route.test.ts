import { afterEach, describe, expect, it, vi } from "vitest";

const submitBetaFeedback = vi.fn();
const getViewerContext = vi.fn();

vi.mock("@/lib/services/beta-feedback-service", () => ({
  submitBetaFeedback
}));

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

describe("feedback route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires auth to submit feedback", async () => {
    getViewerContext.mockResolvedValue(null);

    const { POST } = await import("../../app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "suggestion",
          message: "화면이 조금 헷갈렸어요."
        })
      }) as never
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("blocks pending viewers from feedback submission", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "pending" } });

    const { POST } = await import("../../app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "suggestion",
          message: "대기 상태에서는 피드백도 막혀 있는지 확인하고 싶어요."
        })
      }) as never
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "beta-access-denied",
      status: "pending"
    });
  });

  it("returns 400 when the feedback service rejects input", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    submitBetaFeedback.mockRejectedValue(new Error("invalid-feedback"));

    const { POST } = await import("../../app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "bug",
          message: ""
        })
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid-feedback" });
  });
});
