"use client";

import { useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  ModerationAuditLog,
  ModerationReportListItem,
  ModerationStatus,
  NotificationDeliveryControlAction,
  NotificationEvent,
  NotificationExecutionRunSummary
} from "@/lib/domain/types";
import {
  buildNotificationDeliveryAnalytics,
  filterNotificationDeliveryEventsByScope
} from "@/lib/services/notification-delivery-analytics-service";
import { formatDateTime } from "@/lib/utils";

type OperatorConsoleProps = {
  initialReports: ModerationReportListItem[];
  initialAudits: ModerationAuditLog[];
  initialDeliveryEvents: NotificationEvent[];
  token: string;
};

const statusOptions: ModerationStatus[] = ["active", "under_review", "limited", "removed"];

function groupAuditsByTargetType(audits: ModerationAuditLog[]) {
  return {
    post: audits.filter((audit) => audit.targetType === "post"),
    comment: audits.filter((audit) => audit.targetType === "comment")
  };
}

function isClaimExpired(event: NotificationEvent, now = new Date()) {
  return Boolean(
    event.claimToken &&
      event.claimExpiresAt &&
      new Date(event.claimExpiresAt).getTime() <= now.getTime()
  );
}

function getDeliveryLabel(event: NotificationEvent) {
  if (event.state === "pending") {
    return systemCopy.operator.deliveryLabels.ready;
  }

  if (event.state === "operational_only") {
    return systemCopy.notifications.stateLabels.operational_only;
  }

  if (event.state === "retryable") {
    return systemCopy.operator.deliveryLabels.retryable;
  }

  if (event.state === "failed") {
    return systemCopy.operator.deliveryLabels.failed;
  }

  return systemCopy.operator.deliveryLabels.sent;
}

function getDeliveryAction(
  event: NotificationEvent
):
  | {
      action: NotificationDeliveryControlAction;
      label: string;
    }
  | null {
  if (event.state === "failed" || event.state === "retryable") {
    return {
      action: "requeue",
      label: systemCopy.operator.requeue
    };
  }

  if (isClaimExpired(event)) {
    return {
      action: "release_expired_claim",
      label: systemCopy.operator.releaseClaim
    };
  }

  return null;
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export function OperatorConsole({
  initialReports,
  initialAudits,
  initialDeliveryEvents,
  token
}: OperatorConsoleProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [audits, setAudits] = useState(initialAudits);
  const [deliveryEvents, setDeliveryEvents] = useState(initialDeliveryEvents);
  const [runSummary, setRunSummary] = useState<NotificationExecutionRunSummary | null>(null);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, ModerationStatus>>(
    Object.fromEntries(
      initialReports.map((report) => [report.id, report.targetStatus ?? "under_review"])
    )
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groupedAudits = useMemo(() => groupAuditsByTargetType(audits), [audits]);
  const deliveryAnalytics = useMemo(
    () => buildNotificationDeliveryAnalytics(deliveryEvents),
    [deliveryEvents]
  );
  const deliveryGroups = useMemo(
    () => [
      {
        key: "ready",
        title: systemCopy.operator.deliveryLabels.ready,
        items: filterNotificationDeliveryEventsByScope(deliveryEvents, "ready")
      },
      {
        key: "claimed",
        title: systemCopy.operator.deliveryLabels.claimed,
        items: filterNotificationDeliveryEventsByScope(deliveryEvents, "claimed")
      },
      {
        key: "expired",
        title: systemCopy.operator.deliveryLabels.expired,
        items: filterNotificationDeliveryEventsByScope(deliveryEvents, "expired_claims")
      },
      {
        key: "retryable",
        title: systemCopy.operator.deliveryLabels.retryable,
        items: filterNotificationDeliveryEventsByScope(deliveryEvents, "retryable_backlog")
      },
      {
        key: "failed",
        title: systemCopy.operator.deliveryLabels.failed,
        items: filterNotificationDeliveryEventsByScope(deliveryEvents, "failed")
      },
      {
        key: "sent",
        title: systemCopy.operator.deliveryLabels.sent,
        items: filterNotificationDeliveryEventsByScope(deliveryEvents, "sent")
      }
    ],
    [deliveryEvents]
  );

  const reloadDeliveryEvents = async () => {
    const response = await fetch(
      "/api/internal/debug/notification-delivery?limit=24&state=pending&state=operational_only&state=retryable&state=failed&state=sent",
      {
        headers: {
          "x-cron-secret": token,
          "x-operator-label": "operator-console"
        }
      }
    );

    if (!response.ok) {
      throw new Error("delivery-events-reload-failed");
    }

    const data = await readJson<{ events: NotificationEvent[] }>(response);
    setDeliveryEvents(data.events);
  };

  const updateReportStatus = (
    targetType: "post" | "comment",
    targetId: string,
    status: ModerationStatus
  ) => {
    startTransition(async () => {
      const endpoint =
        targetType === "post"
          ? `/api/internal/moderation/posts/${targetId}`
          : `/api/internal/moderation/comments/${targetId}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": token,
          "x-operator-label": "operator-console"
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        setMessage(systemCopy.operator.error);
        return;
      }

      const data = await readJson<{
        moderation: {
          previousStatus: ModerationStatus;
          status: ModerationStatus;
        };
      }>(response);

      setReports((current) =>
        current.map((report) =>
          report.targetType === targetType && report.targetId === targetId
            ? { ...report, targetStatus: data.moderation.status }
            : report
        )
      );

      if (data.moderation.previousStatus !== data.moderation.status) {
        setAudits((current) => [
          {
            id: `local-${targetType}-${targetId}-${Date.now()}`,
            targetType,
            targetId,
            previousStatus: data.moderation.previousStatus,
            nextStatus: data.moderation.status,
            actorLabel: "operator-console",
            createdAt: new Date().toISOString()
          },
          ...current
        ]);
      }

      setMessage(systemCopy.operator.saved);
      router.refresh();
    });
  };

  const runBatch = () => {
    startTransition(async () => {
      const response = await fetch("/api/internal/delivery/run-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": token,
          "x-operator-label": "operator-console"
        },
        body: JSON.stringify({
          limit: 6,
          claimTtlMinutes: 10,
          retryAfterMinutes: 30
        })
      });

      if (!response.ok) {
        setMessage(systemCopy.operator.error);
        return;
      }

      const data = await readJson<{
        summary: NotificationExecutionRunSummary;
      }>(response);

      setRunSummary(data.summary);
      await reloadDeliveryEvents();
      setMessage(systemCopy.operator.runBatchSaved);
    });
  };

  const applyDeliveryControl = (
    action: NotificationDeliveryControlAction,
    eventId: string
  ) => {
    startTransition(async () => {
      const response = await fetch("/api/internal/delivery/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": token,
          "x-operator-label": "operator-console"
        },
        body: JSON.stringify({
          action,
          eventIds: [eventId]
        })
      });

      if (!response.ok) {
        setMessage(systemCopy.operator.error);
        return;
      }

      await reloadDeliveryEvents();
      setMessage(systemCopy.operator.deliveryControlSaved);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6">
      <SectionCard className="border-amber-100 bg-amber-50/80">
        <p className="text-sm leading-7 text-amber-900">{systemCopy.operator.authNotice}</p>
      </SectionCard>

      {message ? (
        <p className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {message}
        </p>
      ) : null}

      <SectionCard title={systemCopy.operator.reportsTitle}>
        {!reports.length ? (
          <p className="text-sm leading-7 text-slate-600">{systemCopy.operator.empty}</p>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip
                    label={
                      report.targetType === "post"
                        ? systemCopy.operator.labels.postReport
                        : systemCopy.operator.labels.commentReport
                    }
                    tone="quiet"
                  />
                  {report.targetStatus ? (
                    <StatusChip
                      label={systemCopy.operator.statusLabels[report.targetStatus]}
                      tone={report.targetStatus === "removed" ? "active" : "quiet"}
                    />
                  ) : null}
                  <span className="text-xs text-slate-500">{formatDateTime(report.createdAt)}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <p>
                    <span className="font-medium text-slate-900">
                      {systemCopy.operator.labels.target}
                    </span>{" "}
                    {report.targetType} / {report.targetId}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">
                      {systemCopy.operator.labels.reporter}
                    </span>{" "}
                    {report.reporterUserId}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">
                      {systemCopy.operator.labels.reason}
                    </span>{" "}
                    {systemCopy.reporting.reasons[report.reasonKey]}
                  </p>
                  {report.note ? (
                    <p>
                      <span className="font-medium text-slate-900">
                        {systemCopy.operator.labels.note}
                      </span>{" "}
                      {report.note}
                    </p>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <select
                    value={draftStatuses[report.id] ?? "under_review"}
                    disabled={pending}
                    onChange={(event) =>
                      setDraftStatuses((current) => ({
                        ...current,
                        [report.id]: event.target.value as ModerationStatus
                      }))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {systemCopy.operator.statusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      updateReportStatus(
                        report.targetType,
                        report.targetId,
                        draftStatuses[report.id] ?? "under_review"
                      )
                    }
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {pending ? systemCopy.operator.saving : systemCopy.operator.save}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title={systemCopy.operator.auditsTitle}>
        {!audits.length ? (
          <p className="text-sm leading-7 text-slate-600">{systemCopy.operator.auditEmpty}</p>
        ) : (
          <div className="grid gap-6">
            {(["post", "comment"] as const).map((targetType) => {
              const items = groupedAudits[targetType];
              if (!items.length) {
                return null;
              }

              return (
                <div key={targetType} className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <StatusChip
                      label={
                        targetType === "post"
                          ? systemCopy.operator.labels.postReport
                          : systemCopy.operator.labels.commentReport
                      }
                      tone="quiet"
                    />
                    <span className="text-xs text-slate-500">{items.length}</span>
                  </div>
                  <div className="grid gap-3">
                    {items.map((audit) => (
                      <article
                        key={audit.id}
                        className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip
                            label={systemCopy.operator.statusLabels[audit.previousStatus]}
                            tone="quiet"
                          />
                          <span className="text-slate-400">→</span>
                          <StatusChip
                            label={systemCopy.operator.statusLabels[audit.nextStatus]}
                            tone={audit.nextStatus === "removed" ? "active" : "quiet"}
                          />
                          <span className="text-xs text-slate-500">
                            {formatDateTime(audit.createdAt)}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-slate-700">
                          <p>
                            <span className="font-medium text-slate-900">
                              {systemCopy.operator.labels.target}
                            </span>{" "}
                            {audit.targetType} / {audit.targetId}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">
                              {systemCopy.operator.labels.actor}
                            </span>{" "}
                            {audit.actorLabel}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title={systemCopy.operator.deliveryTitle}>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={`${systemCopy.operator.deliveryLabels.ready} ${deliveryAnalytics.readyCount}`} tone="quiet" />
          <StatusChip label={`${systemCopy.operator.deliveryLabels.claimed} ${deliveryAnalytics.claimedCount}`} tone="quiet" />
          <StatusChip label={`${systemCopy.operator.deliveryLabels.expired} ${deliveryAnalytics.expiredClaimCount}`} tone="quiet" />
          <StatusChip label={`${systemCopy.operator.deliveryLabels.retryable} ${deliveryAnalytics.retryableCount}`} tone="quiet" />
          <StatusChip label={`${systemCopy.operator.deliveryLabels.failed} ${deliveryAnalytics.failedCount}`} tone="quiet" />
          <StatusChip label={`${systemCopy.operator.deliveryLabels.sent} ${deliveryAnalytics.sentCount}`} tone="quiet" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={runBatch}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {pending ? systemCopy.operator.runningBatch : systemCopy.operator.runBatch}
          </button>
          <span className="text-xs text-slate-500">
            {deliveryAnalytics.latestAttemptAt
              ? `${systemCopy.operator.labels.attempt} ${formatDateTime(deliveryAnalytics.latestAttemptAt)}`
              : `${systemCopy.operator.labels.attempt} 기록이 아직 없어요.`}
          </span>
        </div>
      </SectionCard>

      <SectionCard title={systemCopy.operator.runSummaryTitle}>
        {!runSummary ? (
          <p className="text-sm leading-7 text-slate-600">{systemCopy.operator.runSummaryEmpty}</p>
        ) : (
          <div className="grid gap-3 text-sm text-slate-700">
            <div className="flex flex-wrap gap-2">
              <StatusChip
                label={`${systemCopy.operator.runSummaryLabels.claimed} ${runSummary.claimedCount}`}
                tone="quiet"
              />
              <StatusChip
                label={`${systemCopy.operator.runSummaryLabels.sent} ${runSummary.sentCount}`}
                tone="quiet"
              />
              <StatusChip
                label={`${systemCopy.operator.runSummaryLabels.failed} ${runSummary.failedCount}`}
                tone="quiet"
              />
              <StatusChip
                label={`${systemCopy.operator.runSummaryLabels.retryable} ${runSummary.retryableCount}`}
                tone="quiet"
              />
              <StatusChip
                label={`${systemCopy.operator.runSummaryLabels.guardrail} ${runSummary.guardrailSkippedCount}`}
                tone="quiet"
              />
            </div>
            <p>
              <span className="font-medium text-slate-900">{systemCopy.operator.labels.claim}</span>{" "}
              {runSummary.claimToken}
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard title={systemCopy.operator.deliveryGroupsTitle}>
        {!deliveryEvents.length ? (
          <p className="text-sm leading-7 text-slate-600">{systemCopy.operator.deliveryEmpty}</p>
        ) : (
          <div className="grid gap-5">
            {deliveryGroups.map((group) =>
              group.items.length ? (
                <div key={group.key} className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <StatusChip label={group.title} tone="quiet" />
                    <span className="text-xs text-slate-500">{group.items.length}</span>
                  </div>
                  <div className="grid gap-3">
                    {group.items.map((event) => {
                      const control = getDeliveryAction(event);

                      return (
                        <article
                          key={event.id}
                          className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusChip label={getDeliveryLabel(event)} tone="quiet" />
                            {event.lane ? (
                              <StatusChip
                                label={systemCopy.notifications.laneLabels[event.lane]}
                                tone="quiet"
                              />
                            ) : null}
                            <span className="text-xs text-slate-500">
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>
                          <div className="mt-4 grid gap-2 text-sm text-slate-700">
                            <p className="font-medium text-slate-900">{event.title}</p>
                            <p>{event.body}</p>
                            <p>
                              <span className="font-medium text-slate-900">
                                {systemCopy.operator.labels.target}
                              </span>{" "}
                              {event.userId}
                              {event.postId ? ` / ${event.postId}` : ""}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">
                                {systemCopy.operator.labels.claim}
                              </span>{" "}
                              {event.claimToken ? "있음" : "없음"}
                              {event.claimExpiresAt
                                ? ` / ${formatDateTime(event.claimExpiresAt)}`
                                : ""}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">
                                {systemCopy.operator.labels.attempt}
                              </span>{" "}
                              {event.attemptCount ?? 0}
                              {event.lastError ? ` / ${event.lastError}` : ""}
                            </p>
                          </div>
                          {control ? (
                            <div className="mt-4">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => applyDeliveryControl(control.action, event.id)}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                              >
                                {pending
                                  ? control.action === "requeue"
                                    ? systemCopy.operator.requeueing
                                    : systemCopy.operator.releasingClaim
                                  : control.label}
                              </button>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
