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
const listBetaAccessRequests = vi.fn();
const listRecentBetaAccessAuditLogs = vi.fn();
const listRecentBetaFeedback = vi.fn();
const summarizeBetaFeedback = vi.fn();
const listRecentModerationFeedback = vi.fn();
const listRecentProductEvents = vi.fn();
const summarizeProductEvents = vi.fn();
const listRecentContentGuardrailFlags = vi.fn();
const summarizeContentGuardrailFlags = vi.fn();
const getSeedContentStatus = vi.fn();
const getBetaDeploymentSelfCheck = vi.fn();
const listOnboardingSourceBundles = vi.fn();
const listOperatorUsers = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => {
      if (key === "x-forwarded-host" || key === "host") {
        return "wayv.app";
      }

      if (key === "x-forwarded-proto") {
        return "https";
      }

      return null;
    }
  })
}));

vi.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  )
}));

vi.mock("@/components/section-card", () => ({
  SectionCard: ({
    children,
    title
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  )
}));

vi.mock("@/components/status-chip", () => ({
  StatusChip: ({ label }: { label: string }) => <span>{label}</span>
}));

vi.mock("@/features/operator/beta-access-panel", () => ({
  BetaAccessPanel: () => <div>beta-access-panel</div>
}));

vi.mock("@/features/operator/operator-console", () => ({
  OperatorConsole: () => <div>operator-console</div>
}));

vi.mock("@/features/operator/moderation-feedback-panel", () => ({
  ModerationFeedbackPanel: () => <div>moderation-feedback-panel</div>
}));

vi.mock("@/features/operator/onboarding-source-panel", () => ({
  OnboardingSourcePanel: () => <div>onboarding-source-panel</div>
}));

vi.mock("@/features/operator/user-management-panel", () => ({
  UserManagementPanel: () => <div>user-management-panel</div>
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

vi.mock("@/lib/services/beta-access-service", () => ({
  listBetaAccessRequests,
  listRecentBetaAccessAuditLogs
}));

vi.mock("@/lib/services/notification-delivery-attempt-log-service", () => ({
  listLatestNotificationDeliveryAttemptsForEvents
}));

vi.mock("@/lib/services/beta-feedback-service", () => ({
  listRecentBetaFeedback,
  summarizeBetaFeedback
}));

vi.mock("@/lib/services/moderation-feedback-service", () => ({
  listRecentModerationFeedback
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

vi.mock("@/lib/services/beta-deployment-self-check-service", () => ({
  getBetaDeploymentSelfCheck
}));

vi.mock("@/lib/services/onboarding-admin-service", () => ({
  listOnboardingSourceBundles
}));

vi.mock("@/lib/services/operator-user-service", () => ({
  listOperatorUsers
}));

describe("operator page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a guarded state for logged-out viewers", async () => {
    getViewerContext.mockResolvedValue(null);

    const { default: OperatorPage } = await import("../../app/internal/operator/page");
    const html = renderToStaticMarkup(await OperatorPage());

    expect(html).toContain("운영자 계정이 필요해요");
    expect(html).not.toContain("operator-console");
  });

  it("shows a guarded state for non-operators", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    getOperatorAccess.mockResolvedValue(null);

    const { default: OperatorPage } = await import("../../app/internal/operator/page");
    const html = renderToStaticMarkup(await OperatorPage());

    expect(html).toContain("운영자 계정이 필요해요");
    expect(html).not.toContain("operator-console");
  });

  it("renders operator panels for authorized operators", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    getOperatorAccess.mockResolvedValue({ userId: "viewer-1", role: "operator" });
    listModerationReports.mockResolvedValue([]);
    listModerationAuditLogs.mockResolvedValue([]);
    listNotificationDeliveryEvents.mockResolvedValue([]);
    listNotificationDeliveryRuns.mockResolvedValue([]);
    listNotificationProviderValidationEntries.mockReturnValue([]);
    listLatestNotificationDeliveryAttemptsForEvents.mockResolvedValue([]);
    listBetaAccessRequests.mockResolvedValue([]);
    listRecentBetaAccessAuditLogs.mockResolvedValue([]);
    listRecentBetaFeedback.mockResolvedValue([]);
    summarizeBetaFeedback.mockReturnValue([]);
    listRecentModerationFeedback.mockResolvedValue([]);
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
    getBetaDeploymentSelfCheck.mockResolvedValue({
      checkedAt: "2026-04-04T10:00:00.000Z",
      request: {
        origin: "https://wayv.app",
        host: "wayv.app"
      },
      envReadiness: {
        status: "ready",
        summary: "배포 환경값이 준비되어 있어요.",
        checks: {},
        appOrigin: "https://wayv.app",
        authRedirectOrigin: "https://wayv.app"
      },
      authFlowReadiness: {
        status: "ready_with_caution",
        summary: "인증 흐름을 한 번 더 확인해 주세요.",
        checks: {}
      },
      operatorBootstrapReadiness: {
        status: "ready",
        summary: "운영자 seed가 확인됐어요.",
        checks: {}
      },
      reviewExportReadiness: {
        status: "ready",
        summary: "검토 export 경로가 준비되어 있어요.",
        checks: {}
      },
      overallStatus: "ready_with_caution",
      notes: ["노트"]
    });
    listOnboardingSourceBundles.mockResolvedValue([]);
    listOperatorUsers.mockResolvedValue([]);

    const { default: OperatorPage } = await import("../../app/internal/operator/page");
    const html = renderToStaticMarkup(await OperatorPage());

    expect(html).toContain("beta-access-panel");
    expect(html).toContain("user-management-panel");
    expect(html).toContain("onboarding-source-panel");
    expect(html).toContain("moderation-feedback-panel");
    expect(html).toContain("operator-console");
    expect(html).toContain("배포 베타 점검");
    expect(html).toContain("배포 환경");
    expect(html).toContain("overall ready with caution");
  });
});
