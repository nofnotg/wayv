import React from "react";
import { headers } from "next/headers";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { OperatorConsole } from "@/features/operator/operator-console";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  BetaFeedback,
  ContentGuardrailFlag,
  NotificationProviderValidationEntry,
  ProductEventLog
} from "@/lib/domain/types";
import {
  getBetaDeploymentSelfCheck,
  type BetaDeploymentSelfCheck
} from "@/lib/services/beta-deployment-self-check-service";
import { listRecentBetaFeedback, summarizeBetaFeedback } from "@/lib/services/beta-feedback-service";
import {
  listRecentContentGuardrailFlags,
  summarizeContentGuardrailFlags
} from "@/lib/services/content-guardrail-service";
import { listLatestNotificationDeliveryAttemptsForEvents } from "@/lib/services/notification-delivery-attempt-log-service";
import { listNotificationDeliveryRuns } from "@/lib/services/notification-delivery-run-history-service";
import { listNotificationProviderValidationEntries } from "@/lib/services/notification-provider-validation-service";
import {
  listModerationAuditLogs,
  listModerationReports
} from "@/lib/services/moderation-admin-service";
import { listNotificationDeliveryEvents } from "@/lib/services/notification-delivery-service";
import { getOperatorAccess } from "@/lib/services/operator-access-service";
import { listRecentProductEvents, summarizeProductEvents } from "@/lib/services/product-event-service";
import { getSeedContentStatus } from "@/lib/services/seed-content-service";
import { getViewerContext } from "@/lib/services/viewer-service";

function getStatusTone(status: BetaDeploymentSelfCheck["overallStatus"]) {
  if (status === "ready") {
    return "active" as const;
  }

  if (status === "ready_with_caution") {
    return "default" as const;
  }

  return "quiet" as const;
}

function getStatusLabel(status: BetaDeploymentSelfCheck["overallStatus"]) {
  if (status === "ready") {
    return "ready";
  }

  if (status === "ready_with_caution") {
    return "ready with caution";
  }

  return "blocked";
}

export default async function OperatorPage() {
  const viewer = await getViewerContext();
  const operatorAccess = viewer ? await getOperatorAccess(viewer.userId) : null;

  if (!viewer || !operatorAccess) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title={systemCopy.operator.forbiddenTitle}
          description={systemCopy.operator.forbiddenDescription}
        />
        <SectionCard className="border-amber-100 bg-amber-50/80">
          <p className="text-sm leading-7 text-amber-900">{systemCopy.operator.authNotice}</p>
        </SectionCard>
      </div>
    );
  }

  const requestHeaders = await headers();
  const requestHost =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    null;
  const requestProtocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const requestUrl = requestHost ? `${requestProtocol}://${requestHost}/internal/operator` : null;

  const [
    reports,
    audits,
    deliveryEvents,
    deliveryRuns,
    senderRegistry,
    betaFeedback,
    productEvents,
    guardrailFlags,
    seedContentStatus,
    betaSelfCheck
  ] = await Promise.all([
    listModerationReports(50),
    listModerationAuditLogs(20),
    listNotificationDeliveryEvents({
      limit: 24,
      states: ["pending", "operational_only", "retryable", "failed", "sent"]
    }),
    listNotificationDeliveryRuns(8),
    Promise.resolve(listNotificationProviderValidationEntries()),
    listRecentBetaFeedback(12),
    listRecentProductEvents(16),
    listRecentContentGuardrailFlags(12),
    getSeedContentStatus(),
    getBetaDeploymentSelfCheck({
      requestUrl,
      viewerUserId: viewer.userId
    })
  ]);
  const retryableEventIds = deliveryEvents
    .filter((event) => event.state === "retryable")
    .map((event) => event.id);
  const retryableAttempts = await listLatestNotificationDeliveryAttemptsForEvents(retryableEventIds);
  const initialSenderRegistry = senderRegistry as NotificationProviderValidationEntry[];
  const initialBetaFeedback = betaFeedback as BetaFeedback[];
  const initialProductEvents = productEvents as ProductEventLog[];
  const initialGuardrailFlags = guardrailFlags as ContentGuardrailFlag[];

  return (
    <div className="grid gap-6">
      <PageHeader
        title={systemCopy.operator.title}
        description={systemCopy.operator.description}
      />
      <SectionCard title="배포 베타 점검">
        <p className="text-sm leading-7 text-slate-600">
          배포 뒤에 바로 운영 준비 상태를 확인할 수 있도록 핵심 점검만 모아 두었어요.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "배포 환경",
              summary: betaSelfCheck.envReadiness.summary,
              status: betaSelfCheck.envReadiness.status
            },
            {
              title: "인증 흐름",
              summary: betaSelfCheck.authFlowReadiness.summary,
              status: betaSelfCheck.authFlowReadiness.status
            },
            {
              title: "운영자 bootstrap",
              summary: betaSelfCheck.operatorBootstrapReadiness.summary,
              status: betaSelfCheck.operatorBootstrapReadiness.status
            },
            {
              title: "검토/export",
              summary: betaSelfCheck.reviewExportReadiness.summary,
              status: betaSelfCheck.reviewExportReadiness.status
            }
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
            >
              <div className="flex items-center gap-2">
                <StatusChip label={getStatusLabel(item.status)} tone={getStatusTone(item.status)} />
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
            </article>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusChip
            label={`overall ${getStatusLabel(betaSelfCheck.overallStatus)}`}
            tone={getStatusTone(betaSelfCheck.overallStatus)}
          />
          {betaSelfCheck.request.host ? (
            <span className="text-xs text-slate-500">request host {betaSelfCheck.request.host}</span>
          ) : (
            <span className="text-xs text-slate-500">request host unknown</span>
          )}
        </div>
        {betaSelfCheck.notes.length ? (
          <ul className="mt-4 grid gap-2 text-sm text-slate-600">
            {betaSelfCheck.notes.map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        ) : null}
      </SectionCard>
      <OperatorConsole
        initialReports={reports}
        initialAudits={audits}
        initialDeliveryEvents={deliveryEvents}
        initialDeliveryRuns={deliveryRuns}
        initialSenderRegistry={initialSenderRegistry}
        initialRetryableAttempts={retryableAttempts}
        initialBetaFeedback={initialBetaFeedback}
        initialBetaFeedbackSummary={summarizeBetaFeedback(initialBetaFeedback)}
        initialProductEvents={initialProductEvents}
        initialProductEventSummary={summarizeProductEvents(initialProductEvents)}
        initialGuardrailFlags={initialGuardrailFlags}
        initialGuardrailSummary={summarizeContentGuardrailFlags(initialGuardrailFlags)}
        initialSeedContentStatus={seedContentStatus}
      />
    </div>
  );
}
