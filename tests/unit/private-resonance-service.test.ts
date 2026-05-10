import { afterEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.fn();
const getWavePostAccess = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient
}));

vi.mock("@/lib/services/wave-access-service", () => ({
  getWavePostAccess
}));

function createQuery(result: unknown) {
  const query = {
    from: vi.fn(() => query),
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
    upsert: vi.fn(() => query),
    single: vi.fn().mockResolvedValue(result),
    delete: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn().mockResolvedValue(result)
  };

  return query;
}

describe("private resonance service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("upserts a valid owner-scoped trace", async () => {
    getWavePostAccess.mockResolvedValue({ post: { id: "post-1" } });
    const query = createQuery({
      data: {
        id: "trace-1",
        user_id: "viewer-1",
        post_id: "post-1",
        resonance_choice: "touched_lightly",
        private_note: "조금 닿았어요.",
        source_path: "/wave/post-1",
        created_at: "2026-05-01T00:00:00.000Z",
        updated_at: "2026-05-01T00:00:00.000Z"
      },
      error: null
    });
    createServerSupabaseClient.mockResolvedValue(query);

    const { upsertPrivateResonanceTrace } = await import(
      "../../lib/services/private-resonance-service"
    );
    const trace = await upsertPrivateResonanceTrace(
      {
        resonanceChoice: "touched_lightly",
        privateNote: "조금 닿았어요.",
        sourcePath: "/wave/post-1"
      },
      "post-1",
      "viewer-1"
    );

    expect(query.from).toHaveBeenCalledWith("private_resonance_traces");
    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "viewer-1",
        post_id: "post-1",
        resonance_choice: "touched_lightly",
        private_note: "조금 닿았어요."
      }),
      { onConflict: "user_id,post_id" }
    );
    expect(trace.privateNote).toBe("조금 닿았어요.");
  });

  it("rejects invalid choices and overly long private notes", async () => {
    const { upsertPrivateResonanceTrace } = await import(
      "../../lib/services/private-resonance-service"
    );

    await expect(
      upsertPrivateResonanceTrace(
        {
          resonanceChoice: "diagnose_me" as never,
          privateNote: "x".repeat(181)
        },
        "post-1",
        "viewer-1"
      )
    ).rejects.toThrow("invalid-private-resonance");

    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("reads traces by post and current viewer id", async () => {
    getWavePostAccess.mockResolvedValue({ post: { id: "post-1" } });
    const query = createQuery({ data: null, error: null });
    createServerSupabaseClient.mockResolvedValue(query);

    const { getPrivateResonanceTrace } = await import(
      "../../lib/services/private-resonance-service"
    );
    await getPrivateResonanceTrace("post-1", "viewer-2");

    expect(query.eq).toHaveBeenCalledWith("post_id", "post-1");
    expect(query.eq).toHaveBeenCalledWith("user_id", "viewer-2");
  });
});
