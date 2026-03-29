"use client";

import { useState, useTransition } from "react";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  ModerationReportListItem,
  ModerationStatus
} from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils";

type OperatorConsoleProps = {
  initialReports: ModerationReportListItem[];
  token: string;
};

const statusOptions: ModerationStatus[] = ["active", "under_review", "limited", "removed"];

export function OperatorConsole({ initialReports, token }: OperatorConsoleProps) {
  const [reports, setReports] = useState(initialReports);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, ModerationStatus>>(
    Object.fromEntries(
      initialReports.map((report) => [report.id, report.targetStatus ?? "under_review"])
    )
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateReportStatus = (targetType: "post" | "comment", targetId: string, status: ModerationStatus) => {
    startTransition(async () => {
      const endpoint =
        targetType === "post"
          ? `/api/internal/moderation/posts/${targetId}`
          : `/api/internal/moderation/comments/${targetId}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": token
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        setMessage(systemCopy.operator.error);
        return;
      }

      setReports((current) =>
        current.map((report) =>
          report.targetType === targetType && report.targetId === targetId
            ? { ...report, targetStatus: status }
            : report
        )
      );
      setMessage(systemCopy.operator.saved);
    });
  };

  if (!reports.length) {
    return (
      <SectionCard>
        <p className="text-sm leading-7 text-slate-600">{systemCopy.operator.empty}</p>
      </SectionCard>
    );
  }

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

      <div className="grid gap-4">
        {reports.map((report) => (
          <SectionCard key={report.id}>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip label={report.targetType === "post" ? "파도 신고" : "댓글 신고"} tone="quiet" />
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
                <span className="font-medium text-slate-900">대상:</span> {report.targetType} / {report.targetId}
              </p>
              <p>
                <span className="font-medium text-slate-900">신고자:</span> {report.reporterUserId}
              </p>
              <p>
                <span className="font-medium text-slate-900">이유:</span>{" "}
                {systemCopy.reporting.reasons[report.reasonKey]}
              </p>
              {report.note ? (
                <p>
                  <span className="font-medium text-slate-900">메모:</span> {report.note}
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
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
