import { afterEach, describe, expect, it, vi } from "vitest";

const getViewerContext = vi.fn();
const getStoredSeedProfile = vi.fn();
const buildHomeFeed = vi.fn();

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

vi.mock("@/lib/services/onboarding-service", () => ({
  getStoredSeedProfile
}));

vi.mock("@/lib/services/feed-service", () => ({
  buildHomeFeed
}));

describe("feed home route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("blocks pending viewers from loading feed data", async () => {
    getViewerContext.mockResolvedValue({
      userId: "viewer-1",
      betaAccess: { status: "pending" }
    });
    const { GET } = await import("../../app/api/feed/home/route");

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "beta-access-denied",
      status: "pending"
    });
  });

  it("returns feed data for approved viewers", async () => {
    getViewerContext.mockResolvedValue({
      userId: "viewer-1",
      betaAccess: { status: "approved" },
      restMode: null
    });
    getStoredSeedProfile.mockResolvedValue({ preferredWaveTone: "quiet" });
    buildHomeFeed.mockResolvedValue({ lanes: {}, weather: [], meta: {} });
    const { GET } = await import("../../app/api/feed/home/route");

    const response = await GET();

    expect(getStoredSeedProfile).toHaveBeenCalledWith("viewer-1");
    expect(buildHomeFeed).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      seedProfile: { preferredWaveTone: "quiet" },
      restMode: null
    });
    expect(response.status).toBe(200);
  });
});
