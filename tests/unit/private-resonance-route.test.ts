import { afterEach, describe, expect, it, vi } from "vitest";

const clearPrivateResonanceTrace = vi.fn();
const getPrivateResonanceTrace = vi.fn();
const getViewerContext = vi.fn();
const upsertPrivateResonanceTrace = vi.fn();

vi.mock("@/lib/services/private-resonance-service", () => ({
  clearPrivateResonanceTrace,
  getPrivateResonanceTrace,
  upsertPrivateResonanceTrace
}));

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

describe("private resonance route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires auth before creating a private resonance trace", async () => {
    getViewerContext.mockResolvedValue(null);
    const { PUT } = await import("../../app/api/posts/[id]/private-resonance/route");

    const response = await PUT(
      new Request("http://localhost/api/posts/post-1/private-resonance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resonanceChoice: "touched_lightly" })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("creates a private resonance trace for the approved viewer only", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    upsertPrivateResonanceTrace.mockResolvedValue({
      id: "trace-1",
      userId: "viewer-1",
      postId: "post-1",
      resonanceChoice: "lingered",
      privateNote: "조금 오래 남았어요."
    });
    const { PUT } = await import("../../app/api/posts/[id]/private-resonance/route");

    const response = await PUT(
      new Request("http://localhost/api/posts/post-1/private-resonance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resonanceChoice: "lingered",
          privateNote: "조금 오래 남았어요.",
          sourcePath: "/wave/post-1"
        })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(upsertPrivateResonanceTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        resonanceChoice: "lingered",
        privateNote: "조금 오래 남았어요."
      }),
      "post-1",
      "viewer-1"
    );
    expect(response.status).toBe(200);
  });

  it("reads only the current viewer's private resonance trace", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-2", betaAccess: { status: "approved" } });
    getPrivateResonanceTrace.mockResolvedValue(null);
    const { GET } = await import("../../app/api/posts/[id]/private-resonance/route");

    const response = await GET(
      new Request("http://localhost/api/posts/post-1/private-resonance?userId=viewer-1") as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(getPrivateResonanceTrace).toHaveBeenCalledWith("post-1", "viewer-2");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ trace: null });
  });

  it("clears the current viewer's private resonance trace", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    clearPrivateResonanceTrace.mockResolvedValue({ ok: true });
    const { DELETE } = await import("../../app/api/posts/[id]/private-resonance/route");

    const response = await DELETE(
      new Request("http://localhost/api/posts/post-1/private-resonance", {
        method: "DELETE"
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(clearPrivateResonanceTrace).toHaveBeenCalledWith("post-1", "viewer-1");
    expect(response.status).toBe(200);
  });
});
