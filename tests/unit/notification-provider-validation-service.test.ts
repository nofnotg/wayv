import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { listNotificationProviderValidationEntries } from "../../lib/services/notification-provider-validation-service";

describe("notification provider validation service", () => {
  const previousEmailEnablement = process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_ENABLED;
  const previousEmailSecret = process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET;

  beforeEach(() => {
    delete process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_ENABLED;
    delete process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET;
  });

  afterEach(() => {
    process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_ENABLED = previousEmailEnablement;
    process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET = previousEmailSecret;
  });

  it("includes preflight warnings when a provider-ready channel is missing secrets", () => {
    const emailEntry = listNotificationProviderValidationEntries().find(
      (entry) => entry.channel === "email"
    );

    expect(emailEntry).toMatchObject({
      channel: "email",
      enablement: "provider_disabled",
      safeFallbackBehavior: "noop",
      preflightReady: false
    });
    expect(emailEntry?.preflightWarnings).toContain("missing-secrets");
    expect(emailEntry?.preflightChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "enablement", passed: false }),
        expect.objectContaining({ key: "secrets", passed: false }),
        expect.objectContaining({ key: "fallback", passed: true })
      ])
    );
  });

  it("marks a provider-enabled channel as preflight ready when secrets are present", () => {
    process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_ENABLED = "true";
    process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET = "email-secret";

    const emailEntry = listNotificationProviderValidationEntries().find(
      (entry) => entry.channel === "email"
    );

    expect(emailEntry).toMatchObject({
      channel: "email",
      enablement: "provider_enabled",
      preflightReady: true,
      preflightWarnings: []
    });
  });
});
