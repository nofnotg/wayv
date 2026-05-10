import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importSeedWavePosts = vi.fn();

vi.mock("@/lib/services/seed-content-service", () => ({
  importSeedWavePosts
}));

describe("seed import route", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = previousSecret;
  });

  it("requires the internal secret", async () => {
    const { POST } = await import("../../app/api/internal/seed/import/route");
    const response = await POST(
      new Request("http://localhost/api/internal/seed/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: [] })
      }) as never
    );

    expect(response.status).toBe(403);
  });

  it("imports seed entries when authorized", async () => {
    importSeedWavePosts.mockResolvedValue({
      importedCount: 1,
      ids: ["seed-post-1"]
    });

    const { POST } = await import("../../app/api/internal/seed/import/route");
    const payload = {
      entries: [
        {
          authorUserId: "11111111-1111-1111-1111-111111111111",
          body: "천천히 버티고 있었다는 마음을 먼저 놓고 갑니다.",
          categories: ["daily_life"],
          emotionTags: ["quiet_hope"],
          visibility: "public",
          seedBatch: "beta-batch-1",
          seedAuthorType: "operator"
        }
      ]
    };
    const response = await POST(
      new Request("http://localhost/api/internal/seed/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "test-secret"
        },
        body: JSON.stringify(payload)
      }) as never
    );

    expect(importSeedWavePosts).toHaveBeenCalledWith(payload.entries);
    expect(response.status).toBe(201);
  });
});
