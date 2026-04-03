import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listNotificationProviderValidationEntries = vi.fn();

vi.mock("@/lib/services/notification-provider-validation-service", () => ({
  listNotificationProviderValidationEntries
}));

describe("notification provider validation debug route", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = previousSecret;
  });

  it("requires the internal secret", async () => {
    const { GET } = await import(
      "../../app/api/internal/debug/notification-provider-validation/route"
    );

    const response = await GET(
      new Request("http://localhost/api/internal/debug/notification-provider-validation") as never
    );

    expect(response.status).toBe(403);
  });

  it("returns provider validation entries for authorized requests", async () => {
    listNotificationProviderValidationEntries.mockReturnValue([
      {
        channel: "email",
        enablement: "provider_disabled",
        mode: "noop",
        activeProviderKey: "email-noop",
        futureProviderKey: "email-provider",
        providerReady: true,
        providerConfigured: false,
        requiredSecrets: ["WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET"],
        missingSecrets: ["WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET"],
        safeFallbackBehavior: "noop",
        preflightReady: false,
        preflightWarnings: ["missing-secrets"],
        preflightChecks: []
      }
    ]);

    const { GET } = await import(
      "../../app/api/internal/debug/notification-provider-validation/route"
    );

    const response = await GET(
      new Request("http://localhost/api/internal/debug/notification-provider-validation", {
        headers: {
          "x-cron-secret": "test-secret"
        }
      }) as never
    );

    expect(listNotificationProviderValidationEntries).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
