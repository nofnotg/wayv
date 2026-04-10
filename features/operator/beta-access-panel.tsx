"use client";

import { useMemo, useState, useTransition } from "react";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import type { BetaAccessAuditLog, BetaAccessRequest, BetaAccessStatus } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils";

type BetaAccessPanelProps = {
  initialRequests: BetaAccessRequest[];
  initialAudits: BetaAccessAuditLog[];
};

type DecisionStatus = Extract<BetaAccessStatus, "approved" | "rejected" | "revoked">;

export function BetaAccessPanel({ initialRequests, initialAudits }: BetaAccessPanelProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [audits, setAudits] = useState(initialAudits);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = useMemo(
    () => ({
      pending: requests.filter((item) => item.status === "pending"),
      reviewed: requests.filter((item) => item.status !== "pending")
    }),
    [requests]
  );

  const updateStatus = (requestId: string, status: DecisionStatus) => {
    startTransition(async () => {
      setMessage(null);

      const response = await fetch(`/api/internal/beta-access/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-operator-label": "operator-beta-access"
        },
        body: JSON.stringify({ status })
      });

      const data = (await response.json().catch(() => null)) as
        | { access?: BetaAccessRequest; error?: string }
        | null;
      const access = data?.access;

      if (!response.ok || !access) {
        setMessage("승인 상태를 저장하지 못했어요.");
        return;
      }

      setRequests((current) =>
        current.map((item) => (item.id === access.id ? access : item))
      );
      setAudits((current) => [
        {
          id: `local-${requestId}-${Date.now()}`,
          requestId,
          userId: access.userId,
          email: access.email,
          actorUserId: null,
          actorLabel: "operator-beta-access",
          previousStatus: requests.find((item) => item.id === requestId)?.status ?? null,
          nextStatus: status,
          note: access.reviewNote,
          createdAt: new Date().toISOString()
        },
        ...current
      ]);
      setMessage("승인 상태를 저장했어요.");
    });
  };

  return (
    <SectionCard
      title="베타 접근 승인"
      description="신청 계정을 승인하거나 보류 상태로 돌릴 수 있어요. 승인 전까지는 앱 안에서 대기 화면만 보이게 돼요."
    >
      {message ? (
        <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="grid gap-4">
          {requests.length ? (
            <>
              {(["pending", "reviewed"] as const).map((bucketKey) =>
                grouped[bucketKey].length ? (
                  <div key={bucketKey} className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <StatusChip
                        label={bucketKey === "pending" ? "대기 중" : "최근 처리됨"}
                        tone={bucketKey === "pending" ? "active" : "quiet"}
                      />
                      <span className="text-xs text-slate-500">{grouped[bucketKey].length}</span>
                    </div>
                    {grouped[bucketKey].map((request) => (
                      <article
                        key={request.id}
                        className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip label={request.status} tone="quiet" />
                          <span className="text-sm font-medium text-slate-900">{request.email}</span>
                          {request.applicantName ? (
                            <span className="text-xs text-slate-500">{request.applicantName}</span>
                          ) : null}
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-slate-700">
                          <p>
                            <span className="font-medium text-slate-900">신청 시각</span>{" "}
                            {formatDateTime(request.appliedAt)}
                          </p>
                          {request.applicationNote ? <p>{request.applicationNote}</p> : null}
                          {request.reviewNote ? (
                            <p>
                              <span className="font-medium text-slate-900">운영 메모</span>{" "}
                              {request.reviewNote}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {request.status !== "approved" ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => updateStatus(request.id, "approved")}
                              className="rounded-full border border-cyan-300 px-4 py-2 text-sm text-cyan-900 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              승인
                            </button>
                          ) : null}
                          {request.status !== "rejected" ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => updateStatus(request.id, "rejected")}
                              className="rounded-full border border-amber-300 px-4 py-2 text-sm text-amber-900 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              거절
                            </button>
                          ) : null}
                          {request.status !== "revoked" ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => updateStatus(request.id, "revoked")}
                              className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              접근 중지
                            </button>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null
              )}
            </>
          ) : (
            <p className="text-sm leading-7 text-slate-600">아직 들어온 베타 신청이 없어요.</p>
          )}
        </div>

        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <StatusChip label="최근 변경 기록" tone="quiet" />
            <span className="text-xs text-slate-500">{audits.length}</span>
          </div>
          {audits.length ? (
            audits.slice(0, 10).map((audit) => (
              <article
                key={audit.id}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-sm font-medium text-slate-900">{audit.email}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(audit.createdAt)}</p>
                <p className="mt-2 text-sm text-slate-700">
                  {audit.previousStatus ?? "new"} → {audit.nextStatus}
                </p>
                <p className="mt-1 text-xs text-slate-500">{audit.actorLabel}</p>
              </article>
            ))
          ) : (
            <p className="text-sm leading-7 text-slate-600">아직 저장된 변경 기록이 없어요.</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
