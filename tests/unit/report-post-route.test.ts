import { afterEach, describe, expect, it, vi } from "vitest";

const createModerationReport = vi.fn();
const getViewerContext = vi.fn();

vi.mock("@/lib/services/reporting-service", () => ({
  createModerationReport
}));

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

describe("post report route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated reporters", async () => {
    getViewerContext.mockResolvedValue(null);
    const { POST } = await import("../../app/api/posts/[id]/report/route");

    const response = await POST(
      new Request("http://localhost/api/posts/post-1/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonKey: "harmful_expression" })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("creates a structured report for authenticated users", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    createModerationReport.mockResolvedValue({ id: "report-1" });
    const { POST } = await import("../../app/api/posts/[id]/report/route");

    const response = await POST(
      new Request("http://localhost/api/posts/post-1/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonKey: "privacy_exposure", note: "이름이 보여요." })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(createModerationReport).toHaveBeenCalledWith(
      { reasonKey: "privacy_exposure", note: "이름이 보여요." },
      "post",
      "post-1",
      "viewer-1"
    );
    expect(response.status).toBe(200);
  });
});
