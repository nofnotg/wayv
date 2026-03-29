"use client";

import { useMemo, useState, useTransition } from "react";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  ModerationAuditLog,
  ModerationReportListItem,
  ModerationStatus,
  NotificationEvent
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

function getDeliveryLabel(event: NotificationEvent) {
  if (event.state === "pending") {
    return "전달 준비";
  }

  if (event.state === "operational_only") {
    return "운영 안내";
  }

  if (event.state === "retryable") {
    return "다시 시도 예정";
  }

  if (event.state === "failed") {
    return "전달 보류";
  }

  return "전달됨";
}

export function OperatorConsole({
  initialReports,
  initialAudits,
  initialDeliveryEvents,
  token
}: OperatorConsoleProps) {
  const [reports, setReports] = useState(initialReports);
  const [audits, setAudits] = useState(initialAudits);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, ModerationStatus>>(
    Object.fromEntries(
      initialReports.map((report) => [report.id, report.targetStatus ?? "under_review"])
    )
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groupedAudits = useMemo(() => groupAuditsByTargetType(audits), [audits]);
  const deliveryAnalytics = useMemo(
    () => buildNotificationDeliveryAnalytics(initialDeliveryEvents),
    [initialDeliveryEvents]
  );
  const deliveryGroups = useMemo(
    () => [
      {
        key: "ready",
        title: "아직 보내지 않은 준비 이벤트",
        items: filterNotificationDeliveryEventsByScope(initialDeliveryEvents, "ready")
      },
      {
        key: "claimed",
        title: "지금 누군가 잡고 있는 배치",
        items: filterNotificationDeliveryEventsByScope(initialDeliveryEvents, "claimed")
      },
      {
        key: "expired",
        title: "다시 살펴볼 만료된 클레임",
        items: filterNotificationDeliveryEventsByScope(initialDeliveryEvents, "expired_claims")
      },
      {
        key: "retryable",
        title: "다시 시도 대기",
        items: filterNotificationDeliveryEventsByScope(
          initialDeliveryEvents,
          "retryable_backlog"
        )
      },
      {
        key: "failed",
        title: "최근 실패",
        items: filterNotificationDeliveryEventsByScope(initialDeliveryEvents, "failed")
      },
      {
        key: "sent",
        title: "최근 전달됨",
        items: filterNotificationDeliveryEventsByScope(initialDeliveryEvents, "sent")
      }
    ],
    [initialDeliveryEvents]
  );

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

      const data = await response.json();
      const moderation = data.moderation as {
        previousStatus: ModerationStatus;
        status: ModerationStatus;
      };

      setReports((current) =>
        current.map((report) =>
          report.targetType === targetType && report.targetId === targetId
            ? { ...report, targetStatus: moderation.status }
            : report
        )
      );

      if (moderation.previousStatus !== moderation.status) {
        setAudits((current) => [
          {
            id: `local-${targetType}-${targetId}-${Date.now()}`,
            targetType,
            targetId,
            previousStatus: moderation.previousStatus,
            nextStatus: moderation.status,
            actorLabel: "operator-console",
            createdAt: new Date().toISOString()
          },
          ...current
        ]);
      }

      setMessage(systemCopy.operator.saved);
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

      <SectionCard title="전달 실행 흐름">
        <div className="flex flex-wrap gap-2">
          <StatusChip label={`준비 ${deliveryAnalytics.readyCount}`} tone="quiet" />
          <StatusChip label={`클레임 ${deliveryAnalytics.claimedCount}`} tone="quiet" />
          <StatusChip label={`만료 ${deliveryAnalytics.expiredClaimCount}`} tone="quiet" />
          <StatusChip label={`재시도 ${deliveryAnalytics.retryableCount}`} tone="quiet" />
          <StatusChip label={`실패 ${deliveryAnalytics.failedCount}`} tone="quiet" />
          <StatusChip label={`전달됨 ${deliveryAnalytics.sentCount}`} tone="quiet" />
        </div>
        <div className="mt-4 grid gap-2 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-900">최근 시도</span>{" "}
            {deliveryAnalytics.latestAttemptAt
              ? formatDateTime(deliveryAnalytics.latestAttemptAt)
              : "아직 없습니다."}
          </p>
          <p>
            <span className="font-medium text-slate-900">평균 시도 횟수</span>{" "}
            {deliveryAnalytics.averageAttemptCount}
          </p>
        </div>
      </SectionCard>

      <SectionCard title="전달 준비와 결과">
        {!initialDeliveryEvents.length ? (
          <p className="text-sm leading-7 text-slate-600">
            아직 살펴볼 전달 이벤트가 없습니다.
          </p>
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
                    {group.items.map((event) => (
                      <article
                        key={event.id}
                        className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip label={getDeliveryLabel(event)} tone="quiet" />
                          {event.lane ? <StatusChip label={event.lane} tone="quiet" /> : null}
                          <span className="text-xs text-slate-500">
                            {formatDateTime(event.createdAt)}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-slate-700">
                          <p className="font-medium text-slate-900">{event.title}</p>
                          <p>{event.body}</p>
                          <p>
                            <span className="font-medium text-slate-900">대상</span>{" "}
                            {event.userId}
                            {event.postId ? ` / ${event.postId}` : ""}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">클레임</span>{" "}
                            {event.claimToken ? "있음" : "없음"}
                            {event.claimExpiresAt
                              ? ` / ${formatDateTime(event.claimExpiresAt)}`
                              : ""}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">시도</span>{" "}
                            {event.attemptCount ?? 0}
                            {event.lastError ? ` / ${event.lastError}` : ""}
                          </p>
                        </div>
                      </article>
                    ))}
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
