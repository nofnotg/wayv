import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getNotificationProviderConfigState } from "../../lib/services/notification-provider-config-service";

describe("notification provider config service", () => {
  const previousEmailSecret = process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET;
  const previousPushSecret = process.env.WAYV_NOTIFICATION_PUSH_PROVIDER_SECRET;

  beforeEach(() => {
    delete process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET;
    delete process.env.WAYV_NOTIFICATION_PUSH_PROVIDER_SECRET;
  });

  afterEach(() => {
    process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET = previousEmailSecret;
    process.env.WAYV_NOTIFICATION_PUSH_PROVIDER_SECRET = previousPushSecret;
  });

  it("reports missing secrets for provider-ready channels", () => {
    expect(getNotificationProviderConfigState("email")).toMatchObject({
      channel: "email",
      providerConfigured: false,
      requiredSecrets: ["WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET"],
      missingSecrets: ["WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET"]
    });
    expect(getNotificationProviderConfigState("push")).toMatchObject({
      channel: "push",
      providerConfigured: false,
      requiredSecrets: ["WAYV_NOTIFICATION_PUSH_PROVIDER_SECRET"],
      missingSecrets: ["WAYV_NOTIFICATION_PUSH_PROVIDER_SECRET"]
    });
  });

  it("marks a channel configured when the required secret is present", () => {
    process.env.WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET = "email-secret";

    expect(getNotificationProviderConfigState("email")).toMatchObject({
      channel: "email",
      providerConfigured: true,
      requiredSecrets: ["WAYV_NOTIFICATION_EMAIL_PROVIDER_SECRET"],
      missingSecrets: []
    });
    expect(getNotificationProviderConfigState("inapp")).toMatchObject({
      channel: "inapp",
      providerConfigured: true,
      requiredSecrets: [],
      missingSecrets: []
    });
  });
});
