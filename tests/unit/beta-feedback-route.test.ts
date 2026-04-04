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

  it("submits feedback for anonymous viewers too", async () => {
    getViewerContext.mockResolvedValue(null);
    submitBetaFeedback.mockResolvedValue({ id: "feedback-1" });

    const { POST } = await import("../../app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "suggestion",
          message: "헷갈리는 버튼이 있어요."
        })
      }) as never
    );

    expect(submitBetaFeedback).toHaveBeenCalledWith(
      {
        category: "suggestion",
        message: "헷갈리는 버튼이 있어요."
      },
      null
    );
    expect(response.status).toBe(201);
  });

  it("returns 400 when the feedback service rejects input", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
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
