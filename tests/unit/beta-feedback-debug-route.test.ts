import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listRecentBetaFeedback = vi.fn();
const summarizeBetaFeedback = vi.fn();

vi.mock("@/lib/services/beta-feedback-service", () => ({
  listRecentBetaFeedback,
  summarizeBetaFeedback
}));

describe("beta feedback debug route", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = previousSecret;
  });

  it("requires the internal secret", async () => {
    const { GET } = await import("../../app/api/internal/debug/beta-feedback/route");
    const response = await GET(
      new Request("http://localhost/api/internal/debug/beta-feedback") as never
    );

    expect(response.status).toBe(403);
  });

  it("returns recent feedback and summary for authorized requests", async () => {
    listRecentBetaFeedback.mockResolvedValue([{ id: "feedback-1", category: "bug" }]);
    summarizeBetaFeedback.mockReturnValue([{ category: "bug", count: 1 }]);

    const { GET } = await import("../../app/api/internal/debug/beta-feedback/route");
    const response = await GET(
      new Request("http://localhost/api/internal/debug/beta-feedback?limit=8", {
        headers: { "x-cron-secret": "test-secret" }
      }) as never
    );

    expect(listRecentBetaFeedback).toHaveBeenCalledWith(8);
    expect(summarizeBetaFeedback).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
