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

  it("returns updated reaction state for an authenticated user", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
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
