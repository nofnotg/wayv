import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listRecentProductEvents = vi.fn();
const summarizeProductEvents = vi.fn();

vi.mock("@/lib/services/product-event-service", () => ({
  listRecentProductEvents,
  summarizeProductEvents
}));

describe("product events debug route", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = previousSecret;
  });

  it("requires the internal secret", async () => {
    const { GET } = await import("../../app/api/internal/debug/product-events/route");
    const response = await GET(
      new Request("http://localhost/api/internal/debug/product-events") as never
    );

    expect(response.status).toBe(403);
  });

  it("returns events and summary when authorized", async () => {
    listRecentProductEvents.mockResolvedValue([{ id: "event-1", eventKey: "post_created" }]);
    summarizeProductEvents.mockReturnValue([{ eventKey: "post_created", count: 1 }]);

    const { GET } = await import("../../app/api/internal/debug/product-events/route");
    const response = await GET(
      new Request("http://localhost/api/internal/debug/product-events?limit=12", {
        headers: { "x-cron-secret": "test-secret" }
      }) as never
    );

    expect(listRecentProductEvents).toHaveBeenCalledWith(12);
    expect(response.status).toBe(200);
  });
});
