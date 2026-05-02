"use client";

import { useState, useTransition } from "react";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import type { BetaAccessRequest, BetaAccessStatus, OperatorUserListItem } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils";

type UserManagementPanelProps = {
  initialUsers: OperatorUserListItem[];
};

type DecisionStatus = Extract<BetaAccessStatus, "approved" | "rejected" | "revoked">;

export function UserManagementPanel({ initialUsers }: UserManagementPanelProps) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateStatus = (requestId: string, status: DecisionStatus) => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/internal/beta-access/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-operator-label": "operator-user-management"
        },
        body: JSON.stringify({ status })
      });
      const data = (await response.json().catch(() => null)) as
        | { access?: BetaAccessRequest; error?: string }
        | null;

      if (!response.ok || !data?.access) {
        setMessage("사용자 권한 상태를 저장하지 못했어요.");
        return;
      }

      setUsers((current) =>
        current.map((user) =>
          user.betaRequest?.id === requestId
            ? { ...user, betaRequest: data.access ?? user.betaRequest }
            : user
        )
      );
      setMessage(
        status === "approved"
          ? "베타 승인을 저장했어요. 이 사용자는 Swim 이용권한 scaffold를 받습니다."
          : "베타 접근 상태를 저장했어요."
      );
    });
  };

  return (
    <SectionCard
      title="사용자 / 권한 관리"
      description="베타 승인 상태와 현재 이용권한을 한 화면에서 봅니다. 결제는 아직 연결하지 않고, 승인 기반 Swim 권한 자리만 마련합니다."
    >
      {message ? (
        <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {message}
        </p>
      ) : null}

      {users.length ? (
        <div className="grid gap-3">
          {users.map((user) => (
            <article
              key={user.userId}
              className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip label={user.betaRequest?.status ?? "no request"} tone="quiet" />
                <StatusChip label={user.entitlement?.planKey ?? "no plan"} tone="quiet" />
                {user.operatorRole ? <StatusChip label={`operator ${user.operatorRole}`} tone="active" /> : null}
                <span className="text-sm font-medium text-slate-900">{user.email}</span>
                {user.nickname ? <span className="text-xs text-slate-500">{user.nickname}</span> : null}
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                <p>
                  <span className="font-medium text-slate-900">온보딩</span>{" "}
                  {user.onboardingCompletedAt ? formatDateTime(user.onboardingCompletedAt) : "미완료"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">최근 활동</span>{" "}
                  {user.lastActiveAt ? formatDateTime(user.lastActiveAt) : "기록 없음"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">이용권한</span>{" "}
                  {user.entitlement
                    ? `${user.entitlement.planKey} / ${user.entitlement.source} / ${user.entitlement.status}`
                    : "없음"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">사용자 ID</span> {user.userId}
                </p>
              </div>

              {user.betaRequest ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {user.betaRequest.status !== "approved" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => updateStatus(user.betaRequest?.id ?? "", "approved")}
                      className="rounded-full border border-cyan-300 px-4 py-2 text-sm text-cyan-900 disabled:text-slate-400"
                    >
                      승인 + Swim 권한
                    </button>
                  ) : null}
                  {user.betaRequest.status !== "rejected" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => updateStatus(user.betaRequest?.id ?? "", "rejected")}
                      className="rounded-full border border-amber-300 px-4 py-2 text-sm text-amber-900 disabled:text-slate-400"
                    >
                      거절
                    </button>
                  ) : null}
                  {user.betaRequest.status !== "revoked" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => updateStatus(user.betaRequest?.id ?? "", "revoked")}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:text-slate-400"
                    >
                      접근 중지
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  아직 베타 신청 레코드가 없어 이 패널에서는 승인할 수 없어요.
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-7 text-slate-600">아직 표시할 사용자 프로필이 없어요.</p>
      )}
    </SectionCard>
  );
}
