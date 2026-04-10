import { afterEach, describe, expect, it, vi } from "vitest";

const createComment = vi.fn();
const getViewerContext = vi.fn();
const listCommentsForPost = vi.fn();

vi.mock("@/lib/services/comment-service", () => ({
  createComment,
  listCommentsForPost
}));

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

describe("post comments route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when an unauthenticated user tries to add a comment", async () => {
    getViewerContext.mockResolvedValue(null);
    const { POST } = await import("../../app/api/posts/[id]/comments/route");

    const response = await POST(
      new Request("http://localhost/api/posts/post-1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "함께 읽고 있어요." })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns 403 when a pending viewer tries to read comments", async () => {
    getViewerContext.mockResolvedValue({
      userId: "viewer-1",
      betaAccess: { status: "pending" }
    });
    const { GET } = await import("../../app/api/posts/[id]/comments/route");

    const response = await GET(new Request("http://localhost") as never, {
      params: Promise.resolve({ id: "post-1" })
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "beta-access-denied",
      status: "pending"
    });
  });

  it("surfaces validation failures from the comment service", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    createComment.mockRejectedValue(new Error("invalid-comment"));
    const { POST } = await import("../../app/api/posts/[id]/comments/route");

    const response = await POST(
      new Request("http://localhost/api/posts/post-1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "" })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid-comment" });
  });
});
