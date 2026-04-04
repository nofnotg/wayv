import React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { OperatorConsole } from "@/features/operator/operator-console";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  BetaFeedback,
  ContentGuardrailFlag,
  NotificationProviderValidationEntry,
  ProductEventLog
} from "@/lib/domain/types";
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

  const [
    reports,
    audits,
    deliveryEvents,
    deliveryRuns,
    senderRegistry,
    betaFeedback,
    productEvents,
    guardrailFlags,
    seedContentStatus
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
    getSeedContentStatus()
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
