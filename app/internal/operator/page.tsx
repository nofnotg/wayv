import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import type { Route } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { BetaAccessPanel } from "@/features/operator/beta-access-panel";
import { ModerationFeedbackPanel } from "@/features/operator/moderation-feedback-panel";
import { OperatorConsole } from "@/features/operator/operator-console";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  BetaAccessAuditLog,
  BetaAccessRequest,
  BetaFeedback,
  ContentGuardrailFlag,
  ModerationFeedback,
  NotificationProviderValidationEntry,
  ProductEventLog
} from "@/lib/domain/types";
import {
  getBetaDeploymentSelfCheck,
  type BetaDeploymentSelfCheck
} from "@/lib/services/beta-deployment-self-check-service";
import {
  listBetaAccessRequests,
  listRecentBetaAccessAuditLogs
} from "@/lib/services/beta-access-service";
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
import { listRecentModerationFeedback } from "@/lib/services/moderation-feedback-service";
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
  const requestHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? null;
  const requestProtocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const requestUrl = requestHost ? `${requestProtocol}://${requestHost}/internal/operator` : null;

  const [
    reports,
    audits,
    deliveryEvents,
    deliveryRuns,
    senderRegistry,
    betaAccessRequests,
    betaAccessAudits,
    betaFeedback,
    moderationFeedback,
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
    listBetaAccessRequests({ limit: 12 }),
    listRecentBetaAccessAuditLogs(12),
    listRecentBetaFeedback(12),
    listRecentModerationFeedback(20),
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

  return (
    <div className="grid gap-6">
      <PageHeader title={systemCopy.operator.title} description={systemCopy.operator.description} />

      <SectionCard title="운영자 사용자 흐름 검수">
        <p className="text-sm leading-7 text-slate-600">
          운영자는 일반 사용자 UI를 그대로 쓰면서, 운영 전용 버튼과 검수 도구만 따로 표시됩니다.
          Free/Swim 플랜 프리뷰는 상단에서 바꿀 수 있고 온보딩은 저장 없이 미리 볼 수 있어요.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={"/onboarding?preview=operator" as Route}
            className="rounded-full bg-[#17241f] px-5 py-3 text-sm font-medium text-[#fffaf0]"
          >
            온보딩 미리보기
          </Link>
          <Link
            href={"/" as Route}
            className="rounded-full border border-[#d8d0c1] px-5 py-3 text-sm text-[#5c665f]"
          >
            일반 UI로 돌아가기
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="배포 베타 점검">
        <p className="text-sm leading-7 text-slate-600">
          배포 이후에도 운영 화면 안에서 바로 베타 준비 상태를 확인할 수 있게 점검 묶음을 두었어요.
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
              title: "운영자 부트스트랩",
              summary: betaSelfCheck.operatorBootstrapReadiness.summary,
              status: betaSelfCheck.operatorBootstrapReadiness.status
            },
            {
              title: "검토 export",
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

      <BetaAccessPanel
        initialRequests={betaAccessRequests as BetaAccessRequest[]}
        initialAudits={betaAccessAudits as BetaAccessAuditLog[]}
      />

      <ModerationFeedbackPanel initialFeedback={moderationFeedback as ModerationFeedback[]} />

      <OperatorConsole
        initialReports={reports}
        initialAudits={audits}
        initialDeliveryEvents={deliveryEvents}
        initialDeliveryRuns={deliveryRuns}
        initialSenderRegistry={senderRegistry as NotificationProviderValidationEntry[]}
        initialRetryableAttempts={retryableAttempts}
        initialBetaFeedback={betaFeedback as BetaFeedback[]}
        initialBetaFeedbackSummary={summarizeBetaFeedback(betaFeedback as BetaFeedback[])}
        initialProductEvents={productEvents as ProductEventLog[]}
        initialProductEventSummary={summarizeProductEvents(productEvents as ProductEventLog[])}
        initialGuardrailFlags={guardrailFlags as ContentGuardrailFlag[]}
        initialGuardrailSummary={summarizeContentGuardrailFlags(
          guardrailFlags as ContentGuardrailFlag[]
        )}
        initialSeedContentStatus={seedContentStatus}
      />
    </div>
  );
}
