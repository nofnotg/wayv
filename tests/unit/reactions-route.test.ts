import { afterEach, describe, expect, it, vi } from "vitest";

const addReaction = vi.fn();
const getReactionCatalog = vi.fn();
const getReactionState = vi.fn();
const getViewerContext = vi.fn();
const removeReaction = vi.fn();

vi.mock("@/lib/services/reaction-service", () => ({
  addReaction,
  getReactionCatalog,
  getReactionState,
  removeReaction
}));

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

describe("post reactions route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when an unauthenticated user tries to add a reaction", async () => {
    getViewerContext.mockResolvedValue(null);
    const { POST } = await import("../../app/api/posts/[id]/reactions/route");

    const response = await POST(
      new Request("http://localhost/api/posts/post-1/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: "touched_me" })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns 403 when a pending viewer tries to load reaction state", async () => {
    getViewerContext.mockResolvedValue({
      userId: "viewer-1",
      betaAccess: { status: "pending" }
    });
    const { GET } = await import("../../app/api/posts/[id]/reactions/route");

    const response = await GET(new Request("http://localhost") as never, {
      params: Promise.resolve({ id: "post-1" })
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "beta-access-denied",
      status: "pending",
      applicationRequired: false
    });
  });

  it("returns 403 with applicationRequired for signed-in viewers without a beta application", async () => {
    getViewerContext.mockResolvedValue({
      userId: "viewer-1",
      betaAccess: null
    });
    const { GET } = await import("../../app/api/posts/[id]/reactions/route");

    const response = await GET(new Request("http://localhost") as never, {
      params: Promise.resolve({ id: "post-1" })
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "beta-access-denied",
      status: null,
      applicationRequired: true
    });
  });

  it("returns updated reaction state for an authenticated user", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    addReaction.mockResolvedValue({
      summary: [{ reactionType: "touched_me", hasActivity: true }],
      viewerReactionTypes: ["touched_me"]
    });
    const { POST } = await import("../../app/api/posts/[id]/reactions/route");

    const response = await POST(
      new Request("http://localhost/api/posts/post-1/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: "touched_me" })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(addReaction).toHaveBeenCalledWith({ reactionType: "touched_me" }, "post-1", "viewer-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      summary: [{ reactionType: "touched_me", hasActivity: true }],
      viewerReactionTypes: ["touched_me"]
    });
  });
});
