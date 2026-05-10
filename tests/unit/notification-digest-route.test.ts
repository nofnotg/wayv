import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runNotificationDigestJob = vi.fn();

vi.mock("@/lib/services/notification-event-service", () => ({
  runNotificationDigestJob
}));

describe("notification digest internal job route", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "digest-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = previousSecret;
  });

  it("requires the internal cron secret", async () => {
    const { POST } = await import("../../app/api/internal/jobs/notification-digest/route");

    const response = await POST(
      new Request("http://localhost/api/internal/jobs/notification-digest", {
        method: "POST"
      }) as never
    );

    expect(response.status).toBe(403);
  });

  it("returns a structured summary after writing notification events", async () => {
    runNotificationDigestJob.mockResolvedValue({
      summary: {
        usersScanned: 2,
        eventsCreated: 1,
        duplicatesSkipped: 1,
        suppressedByRestMode: 1,
        suppressedByPreference: 0,
        suppressedByQuietHours: 0,
        operationalOnly: 0
      },
      perUser: []
    });

    const { POST } = await import("../../app/api/internal/jobs/notification-digest/route");

    const response = await POST(
      new Request("http://localhost/api/internal/jobs/notification-digest?limit=12", {
        method: "POST",
        headers: {
          "x-cron-secret": "digest-secret"
        }
      }) as never
    );

    expect(runNotificationDigestJob).toHaveBeenCalledWith(12);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: "events-persisted",
      summary: {
        usersScanned: 2,
        eventsCreated: 1,
        duplicatesSkipped: 1
      }
    });
  });
});
