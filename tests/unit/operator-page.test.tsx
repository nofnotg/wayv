import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { afterEach, describe, expect, it, vi } from "vitest";

const getViewerContext = vi.fn();
const getOperatorAccess = vi.fn();
const listModerationReports = vi.fn();
const listModerationAuditLogs = vi.fn();
const listNotificationDeliveryEvents = vi.fn();
const listNotificationDeliveryRuns = vi.fn();
const listNotificationProviderValidationEntries = vi.fn();
const listLatestNotificationDeliveryAttemptsForEvents = vi.fn();
const listRecentBetaFeedback = vi.fn();
const summarizeBetaFeedback = vi.fn();
const listRecentProductEvents = vi.fn();
const summarizeProductEvents = vi.fn();
const listRecentContentGuardrailFlags = vi.fn();
const summarizeContentGuardrailFlags = vi.fn();
const getSeedContentStatus = vi.fn();

vi.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  )
}));

vi.mock("@/components/section-card", () => ({
  SectionCard: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

vi.mock("@/features/operator/operator-console", () => ({
  OperatorConsole: () => <div>operator-console</div>
}));

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

vi.mock("@/lib/services/operator-access-service", () => ({
  getOperatorAccess
}));

vi.mock("@/lib/services/moderation-admin-service", () => ({
  listModerationReports,
  listModerationAuditLogs
}));

vi.mock("@/lib/services/notification-delivery-service", () => ({
  listNotificationDeliveryEvents
}));

vi.mock("@/lib/services/notification-delivery-run-history-service", () => ({
  listNotificationDeliveryRuns
}));

vi.mock("@/lib/services/notification-provider-validation-service", () => ({
  listNotificationProviderValidationEntries
}));

vi.mock("@/lib/services/notification-delivery-attempt-log-service", () => ({
  listLatestNotificationDeliveryAttemptsForEvents
}));

vi.mock("@/lib/services/beta-feedback-service", () => ({
  listRecentBetaFeedback,
  summarizeBetaFeedback
}));

vi.mock("@/lib/services/product-event-service", () => ({
  listRecentProductEvents,
  summarizeProductEvents
}));

vi.mock("@/lib/services/content-guardrail-service", () => ({
  listRecentContentGuardrailFlags,
  summarizeContentGuardrailFlags
}));

vi.mock("@/lib/services/seed-content-service", () => ({
  getSeedContentStatus
}));

describe("operator page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a guarded state for non-operators", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    getOperatorAccess.mockResolvedValue(null);

    const { default: OperatorPage } = await import("../../app/internal/operator/page");
    const html = renderToStaticMarkup(await OperatorPage());

    expect(html).toContain("계정");
    expect(html).not.toContain("operator-console");
  });

  it("renders operator console for authorized operators", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    getOperatorAccess.mockResolvedValue({ userId: "viewer-1", role: "operator" });
    listModerationReports.mockResolvedValue([]);
    listModerationAuditLogs.mockResolvedValue([]);
    listNotificationDeliveryEvents.mockResolvedValue([]);
    listNotificationDeliveryRuns.mockResolvedValue([]);
    listNotificationProviderValidationEntries.mockReturnValue([]);
    listLatestNotificationDeliveryAttemptsForEvents.mockResolvedValue([]);
    listRecentBetaFeedback.mockResolvedValue([]);
    summarizeBetaFeedback.mockReturnValue([]);
    listRecentProductEvents.mockResolvedValue([]);
    summarizeProductEvents.mockReturnValue([]);
    listRecentContentGuardrailFlags.mockResolvedValue([]);
    summarizeContentGuardrailFlags.mockReturnValue({ byAction: [], byReason: [] });
    getSeedContentStatus.mockResolvedValue({
      total: 0,
      publicCount: 0,
      latestSeedAt: null,
      batches: [],
      authorTypes: []
    });

    const { default: OperatorPage } = await import("../../app/internal/operator/page");
    const html = renderToStaticMarkup(await OperatorPage());

    expect(html).toContain("operator-console");
  });
});
