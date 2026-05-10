import { afterEach, describe, expect, it, vi } from "vitest";

const getReactionCatalog = vi.fn();
const getViewerContext = vi.fn();
const getWaveDetailById = vi.fn();

vi.mock("@/lib/services/posts-service", () => ({
  getWaveDetailById
}));

vi.mock("@/lib/services/reaction-service", () => ({
  getReactionCatalog
}));

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

describe("post detail route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not expose private resonance notes in the public post payload", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    getReactionCatalog.mockReturnValue([]);
    getWaveDetailById.mockResolvedValue({
      id: "post-1",
      title: "파도",
      body: "본문",
      reactionSummary: [],
      viewerReactionTypes: [],
      comments: [],
      moderation: {
        interactionsEnabled: true
      }
    });
    const { GET } = await import("../../app/api/posts/[id]/route");

    const response = await GET(new Request("http://localhost/api/posts/post-1") as never, {
      params: Promise.resolve({ id: "post-1" })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(JSON.stringify(payload)).not.toContain("privateNote");
    expect(JSON.stringify(payload)).not.toContain("private_note");
    expect(payload.post).not.toHaveProperty("privateResonanceTrace");
  });
});
