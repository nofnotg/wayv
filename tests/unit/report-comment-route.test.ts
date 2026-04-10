import { afterEach, describe, expect, it, vi } from "vitest";

const createModerationReport = vi.fn();
const getViewerContext = vi.fn();

vi.mock("@/lib/services/reporting-service", () => ({
  createModerationReport
}));

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

describe("comment report route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("surfaces structured validation failures", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    createModerationReport.mockRejectedValue(new Error("invalid-report"));
    const { POST } = await import("../../app/api/comments/[id]/report/route");

    const response = await POST(
      new Request("http://localhost/api/comments/comment-1/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonKey: "unknown_reason" })
      }) as never,
      { params: Promise.resolve({ id: "comment-1" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid-report" });
  });
});
