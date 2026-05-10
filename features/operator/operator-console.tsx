"use client";

import { useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  BetaFeedback,
  BetaFeedbackCategory,
  ContentGuardrailAction,
  ContentGuardrailFlag,
  ContentGuardrailReason,
  ModerationAuditLog,
  NotificationChannel,
  NotificationDeliveryAttemptLog,
  NotificationDeliveryRunDetail,
  NotificationDeliveryRunRecord,
  ModerationStatus,
  NotificationDeliveryControlAction,
  NotificationEvent,
  NotificationExecutionRunSummary,
  NotificationProviderValidationEntry,
  NotificationProviderRetryCategory,
  ModerationReportListItem,
  ProductEventKey,
  ProductEventLog,
  SeedAuthorType
} from "@/lib/domain/types";
import { buildNotificationDeliveryAttemptAggregatesForOutcome } from "@/lib/services/notification-delivery-attempt-aggregation-service";
import {
  buildNotificationDeliveryAnalytics,
  filterNotificationDeliveryEventsByScope
} from "@/lib/services/notification-delivery-analytics-service";
import {
  buildRetryableBacklogDrilldown,
  buildRetryableBacklogSummary
} from "@/lib/services/notification-delivery-backlog-summary-service";
import { formatDateTime } from "@/lib/utils";

type OperatorConsoleProps = {
  initialReports: ModerationReportListItem[];
  initialAudits: ModerationAuditLog[];
  initialDeliveryEvents: NotificationEvent[];
  initialDeliveryRuns: NotificationDeliveryRunRecord[];
  initialSenderRegistry: NotificationProviderValidationEntry[];
  initialRetryableAttempts: NotificationDeliveryAttemptLog[];
  initialBetaFeedback: BetaFeedback[];
  initialBetaFeedbackSummary: Array<{ category: BetaFeedbackCategory; count: number }>;
  initialProductEvents: ProductEventLog[];
  initialProductEventSummary: Array<{ eventKey: ProductEventKey; count: number }>;
  initialGuardrailFlags: ContentGuardrailFlag[];
  initialGuardrailSummary: {
    byAction: Array<{ action: string; count: number }>;
    byReason: Array<{ reason: ContentGuardrailReason; count: number }>;
  };
  initialSeedContentStatus: {
    total: number;
    publicCount: number;
    latestSeedAt: string | null;
    batches: string[];
    authorTypes: SeedAuthorType[];
  };
};

const statusOptions: ModerationStatus[] = ["active", "under_review", "limited", "removed"];
const runDetailFilterOptions = ["all", "failed", "retryable", "sent", "guardrail_skipped"] as const;
const runDetailPageSize = 25;
type RunDetailFilter = (typeof runDetailFilterOptions)[number];
type RunDetailChannelFilter = "all" | NotificationChannel;
type RunDetailRetryCategoryFilter = "all" | NotificationProviderRetryCategory;

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

function canSelectAttemptForRetry(attempt: NotificationDeliveryAttemptLog) {
  return attempt.outcome === "failed" || attempt.outcome === "retryable";
}

function toggleSelectedIds(current: string[], id: string) {
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

function resolveActionableEventIds(groupEventIds: string[], selectedIds: string[]) {
  const selectedInGroup = groupEventIds.filter((eventId) => selectedIds.includes(eventId));
  return selectedInGroup.length ? selectedInGroup : groupEventIds;
}

function getFeedbackCategoryLabel(category: BetaFeedbackCategory) {
  switch (category) {
    case "bug":
      return "버그";
    case "confusing":
      return "헷갈림";
    case "suggestion":
      return "제안";
    case "emotional_discomfort":
      return "정서적 불편";
    case "exit_reason":
      return "이탈 이유";
  }
}

function getProductEventLabel(eventKey: ProductEventKey) {
  switch (eventKey) {
    case "signup_started":
      return "가입 시작";
    case "signup_completed":
      return "가입 완료";
    case "onboarding_completed":
      return "온보딩 완료";
    case "post_created":
      return "글 작성";
    case "comment_created":
      return "댓글 작성";
    case "reaction_added":
      return "반응 추가";
    case "rest_mode_started":
      return "휴식 모드 시작";
    case "rest_mode_ended":
      return "휴식 모드 종료";
    case "feedback_submitted":
      return "피드백 제출";
  }
}

function getGuardrailReasonLabel(reason: string) {
  switch (reason) {
    case "profanity":
      return "욕설";
    case "contact_info":
      return "연락처";
    case "spam_link":
      return "링크/홍보";
    case "repeated_characters":
      return "반복 문자";
    case "repeated_tokens":
      return "반복 단어";
    case "high_risk_keyword":
      return "고위험 단어";
  }
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function renderPhase0GuardrailReason(reason: ContentGuardrailReason) {
  switch (reason) {
    case "privacy_exposure":
      return "개인정보 노출";
    case "spam_or_external_pull":
      return "외부 유도";
    case "explicit_profanity":
      return "직설적 욕설";
    case "ridicule_or_mockery":
      return "조롱·비웃음";
    case "blame_or_attack":
      return "비난·공격";
    case "unsolicited_advice":
      return "원치 않는 조언";
    case "harsh_tone":
      return "거친 어조";
    case "crisis_signal":
      return "위기 신호";
    case "evasion_pattern":
      return "회피 패턴";
  }
}

function renderPhase0GuardrailAction(action: string) {
  switch (action) {
    case "allow_with_guidance":
      return "안내와 함께 통과";
    case "soft_hold":
      return "운영 검토 보류";
    case "safety_hold":
      return "안전 검토 보류";
    case "hard_block":
      return "즉시 차단";
    case "block":
      return "즉시 차단";
    case "allow_but_flag":
      return "안내와 함께 통과";
    default:
      return action;
  }
}

function renderPhase0GuardrailSeverity(severity: ContentGuardrailFlag["severity"]) {
  switch (severity) {
    case "low":
      return "낮음";
    case "medium":
      return "보통";
    case "high":
      return "높음";
    case "critical":
      return "긴급";
  }
}

function renderPhase0GuardrailTarget(targetType: ContentGuardrailFlag["targetType"]) {
  switch (targetType) {
    case "post_title":
      return "파도 제목";
    case "post_body":
      return "파도 본문";
    case "comment_body":
      return "댓글";
    case "beta_application_note":
      return "베타 신청 메모";
    case "profile_bio":
      return "프로필 소개";
    case "feedback_message":
      return "피드백 메시지";
  }
}

export function OperatorConsole({
  initialReports,
  initialAudits,
  initialDeliveryEvents,
  initialDeliveryRuns,
  initialSenderRegistry,
  initialRetryableAttempts,
  initialBetaFeedback,
  initialBetaFeedbackSummary,
  initialProductEvents,
  initialProductEventSummary,
  initialGuardrailFlags,
  initialGuardrailSummary,
  initialSeedContentStatus
}: OperatorConsoleProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [audits, setAudits] = useState(initialAudits);
  const [deliveryEvents, setDeliveryEvents] = useState(initialDeliveryEvents);
  const [deliveryRuns, setDeliveryRuns] = useState(initialDeliveryRuns);
  const [senderRegistry] = useState(initialSenderRegistry);
  const [retryableAttempts, setRetryableAttempts] = useState(initialRetryableAttempts);
  const [betaFeedback] = useState(initialBetaFeedback);
  const [betaFeedbackSummary] = useState(initialBetaFeedbackSummary);
  const [productEvents] = useState(initialProductEvents);
  const [productEventSummary] = useState(initialProductEventSummary);
  const [guardrailFlags] = useState(initialGuardrailFlags);
  const [guardrailSummary] = useState(initialGuardrailSummary);
  const [seedContentStatus] = useState(initialSeedContentStatus);
  const [selectedRunDetail, setSelectedRunDetail] = useState<NotificationDeliveryRunDetail | null>(
    null
  );
  const [selectedDeliveryEventIds, setSelectedDeliveryEventIds] = useState<string[]>([]);
  const [selectedRunAttemptEventIds, setSelectedRunAttemptEventIds] = useState<string[]>([]);
  const [runDetailFilter, setRunDetailFilter] = useState<RunDetailFilter>("all");
  const [runDetailChannelFilter, setRunDetailChannelFilter] =
    useState<RunDetailChannelFilter>("all");
  const [runDetailProviderFilter, setRunDetailProviderFilter] = useState("all");
  const [runDetailRetryCategoryFilter, setRunDetailRetryCategoryFilter] =
    useState<RunDetailRetryCategoryFilter>("all");
  const [runDetailLoading, setRunDetailLoading] = useState(false);
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
  const retryableBacklogSummary = useMemo(
    () => buildRetryableBacklogSummary(deliveryEvents),
    [deliveryEvents]
  );
  const retryableBacklogDrilldown = useMemo(() => {
    const retryableEventIds = new Set(
      deliveryEvents.filter((event) => event.state === "retryable").map((event) => event.id)
    );

    const retryableEvents = deliveryEvents.filter((event) => retryableEventIds.has(event.id));

    return buildRetryableBacklogDrilldown(
      retryableAttempts.filter((attempt) => retryableEventIds.has(attempt.eventId)),
      retryableEvents
    );
  }, [deliveryEvents, retryableAttempts]);
  const availableRunDetailProviders = useMemo(() => {
    if (!selectedRunDetail) {
      return [] as string[];
    }

    return [...new Set(selectedRunDetail.attempts.map((attempt) => attempt.providerKey))].sort();
  }, [selectedRunDetail]);
  const availableRunDetailRetryCategories = useMemo(() => {
    if (!selectedRunDetail) {
      return [] as NotificationProviderRetryCategory[];
    }

    return [
      ...new Set(
        selectedRunDetail.attempts
          .map((attempt) => attempt.retryCategory)
          .filter((value): value is NotificationProviderRetryCategory => Boolean(value))
      )
    ].sort();
  }, [selectedRunDetail]);
  const visibleRunAttempts = useMemo(() => {
    if (!selectedRunDetail) {
      return [] as NotificationDeliveryAttemptLog[];
    }

    return selectedRunDetail.attempts
      .filter((attempt) => (runDetailFilter === "all" ? true : attempt.outcome === runDetailFilter))
      .filter((attempt) =>
        runDetailChannelFilter === "all" ? true : attempt.channel === runDetailChannelFilter
      )
      .filter((attempt) =>
        runDetailProviderFilter === "all" ? true : attempt.providerKey === runDetailProviderFilter
      )
      .filter((attempt) =>
        runDetailRetryCategoryFilter === "all"
          ? true
          : attempt.retryCategory === runDetailRetryCategoryFilter
      );
  }, [
    runDetailChannelFilter,
    runDetailFilter,
    runDetailProviderFilter,
    runDetailRetryCategoryFilter,
    selectedRunDetail
  ]);
  const selectedRunRetryableEventIds = useMemo(() => {
    if (!selectedRunDetail) {
      return [] as string[];
    }

    const retryableIds = new Set(
      selectedRunDetail.attempts
        .filter((attempt) => canSelectAttemptForRetry(attempt))
        .map((attempt) => attempt.eventId)
    );

    return selectedRunAttemptEventIds.filter((eventId) => retryableIds.has(eventId));
  }, [selectedRunAttemptEventIds, selectedRunDetail]);
  const failedAttemptAggregates = useMemo(() => {
    if (!selectedRunDetail) {
      return null;
    }

    return buildNotificationDeliveryAttemptAggregatesForOutcome(
      selectedRunDetail.attempts,
      "failed"
    );
  }, [selectedRunDetail]);
  const retryableAttemptAggregates = useMemo(() => {
    if (!selectedRunDetail) {
      return null;
    }

    return buildNotificationDeliveryAttemptAggregatesForOutcome(
      selectedRunDetail.attempts,
      "retryable"
    );
  }, [selectedRunDetail]);

  const reloadDeliveryEvents = async () => {
    const response = await fetch(
      "/api/internal/debug/notification-delivery?limit=24&state=pending&state=operational_only&state=retryable&state=failed&state=sent",
      {
        headers: {
          "x-operator-label": "operator-console"
        }
      }
    );

    if (!response.ok) {
      throw new Error("delivery-events-reload-failed");
    }

    const data = await readJson<{ events: NotificationEvent[] }>(response);
    setDeliveryEvents(data.events);
    return data.events;
  };

  const reloadDeliveryRuns = async () => {
    const response = await fetch("/api/internal/debug/notification-delivery-runs?limit=8", {
      headers: {
        "x-operator-label": "operator-console"
      }
    });

    if (!response.ok) {
      throw new Error("delivery-runs-reload-failed");
    }

    const data = await readJson<{ runs: NotificationDeliveryRunRecord[] }>(response);
    setDeliveryRuns(data.runs);
  };

  const loadRunDetail = async (
    runId: string,
    options: {
      offset?: number;
      cursor?: string | null;
      resetFilters?: boolean;
    } = {}
  ) => {
    setRunDetailLoading(true);
    if (options.resetFilters ?? true) {
      setRunDetailFilter("all");
      setRunDetailChannelFilter("all");
      setRunDetailProviderFilter("all");
      setRunDetailRetryCategoryFilter("all");
    }
    setSelectedRunAttemptEventIds([]);

    try {
      const params = new URLSearchParams({
        limit: String(runDetailPageSize)
      });

      if (options.cursor) {
        params.set("cursor", options.cursor);
      } else {
        params.set("offset", String(options.offset ?? 0));
      }
      const response = await fetch(
        `/api/internal/debug/notification-delivery-runs/${runId}?${params.toString()}`,
        {
          headers: {
            "x-operator-label": "operator-console"
          }
        }
      );

      if (!response.ok) {
        throw new Error("delivery-run-detail-load-failed");
      }

      const data = await readJson<NotificationDeliveryRunDetail>(response);
      setSelectedRunDetail(data);
    } finally {
      setRunDetailLoading(false);
    }
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
        run: NotificationDeliveryRunRecord;
      }>(response);

      setRunSummary(data.summary);
      setDeliveryRuns((current) => [data.run, ...current].slice(0, 8));
      const nextEvents = await reloadDeliveryEvents();
      const retryableEventIds = new Set(
        nextEvents.filter((event) => event.state === "retryable").map((event) => event.id)
      );
      setRetryableAttempts((current) =>
        current.filter((attempt) => retryableEventIds.has(attempt.eventId))
      );
      await loadRunDetail(data.run.id);
      setMessage(systemCopy.operator.runBatchSaved);
    });
  };

  const applyDeliveryControl = (
    action: NotificationDeliveryControlAction,
    eventIds: string[]
  ) => {
    startTransition(async () => {
      const response = await fetch("/api/internal/delivery/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-label": "operator-console"
        },
        body: JSON.stringify({
          action,
          eventIds
        })
      });

      if (!response.ok) {
        setMessage(systemCopy.operator.error);
        return;
      }

      const nextEvents = await reloadDeliveryEvents();
      const retryableEventIds = new Set(
        nextEvents.filter((event) => event.state === "retryable").map((event) => event.id)
      );
      setRetryableAttempts((current) =>
        current.filter((attempt) => retryableEventIds.has(attempt.eventId))
      );
      await reloadDeliveryRuns();
      setSelectedDeliveryEventIds((current) => current.filter((eventId) => !eventIds.includes(eventId)));
      setSelectedRunAttemptEventIds((current) =>
        current.filter((eventId) => !eventIds.includes(eventId))
      );
      if (selectedRunDetail) {
        await loadRunDetail(selectedRunDetail.run.id, {
          offset: selectedRunDetail.page.offset,
          resetFilters: false
        });
      }
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

      <SectionCard title="베타 준비 신호">
        <div className="mb-4 flex flex-wrap gap-2 text-sm text-slate-600">
          <a
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:text-slate-900"
            href="/api/internal/review/beta-feedback?format=json&limit=100"
            target="_blank"
            rel="noreferrer"
          >
            피드백 검토 JSON
          </a>
          <a
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:text-slate-900"
            href="/api/internal/review/product-events?format=csv&limit=200"
            target="_blank"
            rel="noreferrer"
          >
            이벤트 내보내기 CSV
          </a>
          <a
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:text-slate-900"
            href="/api/internal/review/content-guardrails?format=json&limit=100"
            target="_blank"
            rel="noreferrer"
          >
            가드레일 검토 JSON
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <StatusChip label="최근 피드백" tone="quiet" />
              {betaFeedbackSummary.map((item) => (
                <StatusChip
                  key={`feedback-${item.category}`}
                  label={`${getFeedbackCategoryLabel(item.category)} ${item.count}`}
                  tone="quiet"
                />
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              {betaFeedback.length ? (
                betaFeedback.slice(0, 4).map((item) => (
                  <p key={item.id}>
                    <span className="font-medium text-slate-900">
                      {getFeedbackCategoryLabel(item.category)}
                    </span>{" "}
                    {item.message}
                  </p>
                ))
              ) : (
                <p>아직 들어온 피드백이 없어요.</p>
              )}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <StatusChip label="최근 이벤트" tone="quiet" />
              {productEventSummary.slice(0, 4).map((item) => (
                <StatusChip
                  key={`event-${item.eventKey}`}
                  label={`${getProductEventLabel(item.eventKey)} ${item.count}`}
                  tone="quiet"
                />
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              {productEvents.slice(0, 4).map((item) => (
                <p key={item.id}>
                  <span className="font-medium text-slate-900">
                    {getProductEventLabel(item.eventKey)}
                  </span>{" "}
                  {formatDateTime(item.createdAt)}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <StatusChip label="가드레일 플래그" tone="quiet" />
              {guardrailSummary.byAction.map((item) => (
                <StatusChip
                  key={`guardrail-action-${item.action}`}
                  label={`${item.action === "block" ? "차단" : "통과 후 확인"} ${item.count}`}
                  tone={item.action === "block" ? "active" : "quiet"}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-700">
              {guardrailSummary.byReason.slice(0, 5).map((item) => (
                <StatusChip
                  key={`guardrail-reason-${item.reason}`}
                  label={`${getGuardrailReasonLabel(item.reason)} ${item.count}`}
                  tone="quiet"
                />
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              {guardrailFlags.slice(0, 3).map((item) => (
                <p key={item.id}>
                  <span className="font-medium text-slate-900">
                    {item.action === "block" ? "차단" : "통과 후 확인"}
                  </span>{" "}
                  {item.contentExcerpt ?? "내용 일부 없음"}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <StatusChip label="시드 콘텐츠" tone="quiet" />
              <StatusChip label={`전체 ${seedContentStatus.total}`} tone="quiet" />
              <StatusChip label={`공개 ${seedContentStatus.publicCount}`} tone="quiet" />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-900">최근 배치</span>{" "}
                {seedContentStatus.batches[0] ?? "없음"}
              </p>
              <p>
                <span className="font-medium text-slate-900">최근 입력</span>{" "}
                {seedContentStatus.latestSeedAt ? formatDateTime(seedContentStatus.latestSeedAt) : "없음"}
              </p>
              <p>
                <span className="font-medium text-slate-900">작성자 유형</span>{" "}
                {seedContentStatus.authorTypes.length ? seedContentStatus.authorTypes.join(", ") : "없음"}
              </p>
            </div>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Phase 0 가드레일 검토 큐">
        <div className="mb-4 flex flex-wrap gap-2 text-sm text-slate-600">
          <a
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:text-slate-900"
            href="/api/internal/review/content-guardrails?format=json&limit=100"
            target="_blank"
            rel="noreferrer"
          >
            가드레일 JSON 열기
          </a>
          <a
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:text-slate-900"
            href="/api/internal/review/content-guardrails?format=csv&limit=200"
            target="_blank"
            rel="noreferrer"
          >
            가드레일 CSV 내보내기
          </a>
        </div>

        {!guardrailFlags.length ? (
          <p className="text-sm leading-7 text-slate-600">아직 검토할 가드레일 항목이 없어요.</p>
        ) : (
          <div className="grid gap-3">
            {guardrailFlags.slice(0, 8).map((item) => (
              <article
                key={`phase0-guardrail-${item.id}`}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip label={renderPhase0GuardrailTarget(item.targetType)} tone="quiet" />
                  <StatusChip label={renderPhase0GuardrailAction(item.action)} tone="quiet" />
                  <StatusChip label={renderPhase0GuardrailSeverity(item.severity)} tone="quiet" />
                  <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <p>
                    <span className="font-medium text-slate-900">원문</span>{" "}
                    {item.originalText ?? item.contentExcerpt ?? "없음"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">사유 계열</span>{" "}
                    {item.reasons.map(renderPhase0GuardrailReason).join(", ")}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">매칭 용어</span>{" "}
                    {item.matchedTerms.length ? item.matchedTerms.join(", ") : "없음"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">제안 동작</span>{" "}
                    {renderPhase0GuardrailAction(item.suggestedAction)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">사용자 식별자</span>{" "}
                    {item.userId ?? "없음"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

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
                          <span className="text-slate-400">-&gt;</span>
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
              : `${systemCopy.operator.labels.attempt} 湲곕줉???꾩쭅 ?놁뼱??`}
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

      <SectionCard title={systemCopy.operator.runHistoryTitle}>
        {!deliveryRuns.length ? (
          <p className="text-sm leading-7 text-slate-600">{systemCopy.operator.runHistoryEmpty}</p>
        ) : (
          <div className="grid gap-3">
            {deliveryRuns.map((run) => (
              <article
                key={run.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip label={formatDateTime(run.ranAt)} tone="quiet" />
                  <StatusChip
                    label={`${systemCopy.operator.runSummaryLabels.claimed} ${run.claimedCount}`}
                    tone="quiet"
                  />
                  <StatusChip
                    label={`${systemCopy.operator.runSummaryLabels.sent} ${run.sentCount}`}
                    tone="quiet"
                  />
                  <StatusChip
                    label={`${systemCopy.operator.runSummaryLabels.failed} ${run.failedCount}`}
                    tone="quiet"
                  />
                  <StatusChip
                    label={`${systemCopy.operator.runSummaryLabels.retryable} ${run.retryableCount}`}
                    tone="quiet"
                  />
                  <StatusChip
                    label={`${systemCopy.operator.runSummaryLabels.guardrail} ${run.guardrailSkippedCount}`}
                    tone="quiet"
                  />
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">
                    {systemCopy.operator.labels.claim}
                  </span>{" "}
                  {run.claimToken}
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={pending || runDetailLoading}
                    onClick={() => {
                      void loadRunDetail(run.id);
                    }}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {runDetailLoading &&
                    selectedRunDetail?.run.id === run.id
                      ? systemCopy.operator.runDetailLoading
                      : systemCopy.operator.viewRunDetail}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title={systemCopy.operator.runDetailTitle}>
        {!selectedRunDetail ? (
          <p className="text-sm leading-7 text-slate-600">{systemCopy.operator.runDetailEmpty}</p>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <StatusChip
                label={`${systemCopy.operator.runSummaryLabels.claimed} ${selectedRunDetail.run.claimedCount}`}
                tone="quiet"
              />
              <StatusChip
                label={`${systemCopy.operator.runSummaryLabels.sent} ${selectedRunDetail.run.sentCount}`}
                tone="quiet"
              />
              <StatusChip
                label={`${systemCopy.operator.runSummaryLabels.failed} ${selectedRunDetail.run.failedCount}`}
                tone="quiet"
              />
              <StatusChip
                label={`${systemCopy.operator.runSummaryLabels.retryable} ${selectedRunDetail.run.retryableCount}`}
                tone="quiet"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  {systemCopy.operator.runAggregateTitles.failedByRetryCategory}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(failedAttemptAggregates?.byRetryCategory.length
                    ? failedAttemptAggregates.byRetryCategory
                    : selectedRunDetail.aggregates.byRetryCategory
                  )
                    .slice(0, 3)
                    .map((bucket) => (
                      <StatusChip
                        key={`failed-retry-${bucket.key}`}
                        label={`${systemCopy.operator.retryCategoryLabels[
                          bucket.key as NotificationProviderRetryCategory
                        ]} ${bucket.count}`}
                        tone="quiet"
                      />
                    ))}
                </div>
              </article>
              <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  {systemCopy.operator.runAggregateTitles.failedByProvider}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(failedAttemptAggregates?.byProvider.length
                    ? failedAttemptAggregates.byProvider
                    : selectedRunDetail.aggregates.byProvider
                  )
                    .slice(0, 3)
                    .map((bucket) => (
                      <StatusChip
                        key={`failed-provider-${bucket.key}`}
                        label={`${bucket.key} ${bucket.count}`}
                        tone="quiet"
                      />
                    ))}
                </div>
              </article>
              <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  {systemCopy.operator.runAggregateTitles.retryableByChannel}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(retryableAttemptAggregates?.byChannel.length
                    ? retryableAttemptAggregates.byChannel
                    : selectedRunDetail.aggregates.byChannel
                  )
                    .slice(0, 3)
                    .map((bucket) => (
                      <StatusChip
                        key={`retryable-channel-${bucket.key}`}
                        label={`${bucket.key} ${bucket.count}`}
                        tone="quiet"
                      />
                    ))}
                </div>
              </article>
              <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  {systemCopy.operator.runAggregateTitles.senderModes}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRunDetail.aggregates.bySenderMode.slice(0, 3).map((bucket) => (
                    <StatusChip
                      key={`sender-mode-${bucket.key}`}
                      label={`${systemCopy.operator.senderModeLabels[bucket.key as "noop" | "provider"]} ${bucket.count}`}
                      tone="quiet"
                    />
                  ))}
                </div>
              </article>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {runDetailFilterOptions.map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setRunDetailFilter(filterKey)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    runDetailFilter === filterKey
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 text-slate-700"
                  }`}
                >
                  {filterKey === "all"
                    ? systemCopy.operator.runDetailFilterAll
                    : systemCopy.operator.attemptOutcomeLabels[filterKey]}
                </button>
              ))}
              <select
                value={runDetailChannelFilter}
                onChange={(event) =>
                  setRunDetailChannelFilter(event.target.value as RunDetailChannelFilter)
                }
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="all">
                  {systemCopy.operator.labels.channel} 쨌 {systemCopy.operator.filterAll}
                </option>
                <option value="inapp">inapp</option>
                <option value="email">email</option>
                <option value="push">push</option>
              </select>
              <select
                value={runDetailProviderFilter}
                onChange={(event) => setRunDetailProviderFilter(event.target.value)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="all">
                  {systemCopy.operator.labels.provider} 쨌 {systemCopy.operator.filterAll}
                </option>
                {availableRunDetailProviders.map((providerKey) => (
                  <option key={providerKey} value={providerKey}>
                    {providerKey}
                  </option>
                ))}
              </select>
              <select
                value={runDetailRetryCategoryFilter}
                onChange={(event) =>
                  setRunDetailRetryCategoryFilter(
                    event.target.value as RunDetailRetryCategoryFilter
                  )
                }
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="all">
                  {systemCopy.operator.labels.retryCategory} 쨌 {systemCopy.operator.filterAll}
                </option>
                {availableRunDetailRetryCategories.map((retryCategory) => (
                  <option key={retryCategory} value={retryCategory}>
                    {systemCopy.operator.retryCategoryLabels[retryCategory]}
                  </option>
                ))}
              </select>
              {selectedRunRetryableEventIds.length ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => applyDeliveryControl("requeue", selectedRunRetryableEventIds)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {pending
                    ? systemCopy.operator.selectedRequeueing
                    : `${systemCopy.operator.selectedRetry} ${selectedRunRetryableEventIds.length}`}
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <span>
                {selectedRunDetail.page.total === 0
                  ? systemCopy.operator.runDetailPageEmpty
                  : `${selectedRunDetail.page.offset + 1}-${Math.min(
                      selectedRunDetail.page.offset + selectedRunDetail.attempts.length,
                      selectedRunDetail.page.total
                    )} / ${selectedRunDetail.page.total}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    pending || runDetailLoading || !selectedRunDetail.page.previousCursor
                  }
                  onClick={() =>
                    void loadRunDetail(selectedRunDetail.run.id, {
                      cursor: selectedRunDetail.page.previousCursor,
                      resetFilters: false
                    })
                  }
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {systemCopy.operator.previousPage}
                </button>
                <button
                  type="button"
                  disabled={pending || runDetailLoading || !selectedRunDetail.page.nextCursor}
                  onClick={() =>
                    void loadRunDetail(selectedRunDetail.run.id, {
                      cursor: selectedRunDetail.page.nextCursor,
                      resetFilters: false
                    })
                  }
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {systemCopy.operator.nextPage}
                </button>
              </div>
            </div>
            {!visibleRunAttempts.length ? (
              <p className="text-sm leading-7 text-slate-600">{systemCopy.operator.runDetailEmpty}</p>
            ) : (
              <div className="grid gap-3">
                {visibleRunAttempts.map((attempt) => (
                  <article
                    key={attempt.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {canSelectAttemptForRetry(attempt) ? (
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                          <input
                            type="checkbox"
                            checked={selectedRunAttemptEventIds.includes(attempt.eventId)}
                            disabled={pending}
                            onChange={() =>
                              setSelectedRunAttemptEventIds((current) =>
                                toggleSelectedIds(current, attempt.eventId)
                              )
                            }
                          />
                          {systemCopy.operator.selectedRetryLabel}
                        </label>
                      ) : null}
                      <StatusChip
                        label={systemCopy.operator.attemptOutcomeLabels[attempt.outcome]}
                        tone={attempt.outcome === "failed" ? "active" : "quiet"}
                      />
                      <StatusChip label={attempt.channel} tone="quiet" />
                      <StatusChip label={attempt.adapterKey} tone="quiet" />
                      <StatusChip label={attempt.providerKey} tone="quiet" />
                      <StatusChip
                        label={systemCopy.operator.senderModeLabels[attempt.senderMode]}
                        tone="quiet"
                      />
                      {attempt.retryCategory ? (
                        <StatusChip
                          label={systemCopy.operator.retryCategoryLabels[attempt.retryCategory]}
                          tone={attempt.outcome === "failed" ? "active" : "quiet"}
                        />
                      ) : null}
                      <span className="text-xs text-slate-500">
                        {formatDateTime(attempt.createdAt)}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-700">
                      <p>
                        <span className="font-medium text-slate-900">
                          {systemCopy.operator.labels.target}
                        </span>{" "}
                        {attempt.eventId}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">
                          {systemCopy.operator.labels.outcome}
                        </span>{" "}
                        {systemCopy.operator.attemptOutcomeLabels[attempt.outcome]}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">
                          {systemCopy.operator.labels.adapter}
                        </span>{" "}
                        {attempt.adapterKey}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">
                          {systemCopy.operator.labels.provider}
                        </span>{" "}
                        {attempt.providerKey}
                      </p>
                      {attempt.externalMessageId ? (
                        <p>
                          <span className="font-medium text-slate-900">
                            {systemCopy.operator.labels.externalMessageId}
                          </span>{" "}
                          {attempt.externalMessageId}
                        </p>
                      ) : null}
                      {attempt.retryCategory ? (
                        <p>
                          <span className="font-medium text-slate-900">
                            {systemCopy.operator.labels.retryCategory}
                          </span>{" "}
                          {systemCopy.operator.retryCategoryLabels[attempt.retryCategory]}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-medium text-slate-900">
                          {systemCopy.operator.labels.senderMode}
                        </span>{" "}
                        {systemCopy.operator.senderModeLabels[attempt.senderMode]}
                      </p>
                      {attempt.currentEventState ? (
                        <p>
                          <span className="font-medium text-slate-900">
                            {systemCopy.operator.labels.currentState}
                          </span>{" "}
                          {systemCopy.notifications.stateLabels[
                            attempt.currentEventState as keyof typeof systemCopy.notifications.stateLabels
                          ] ?? attempt.currentEventState}
                        </p>
                      ) : null}
                      {typeof attempt.attemptCount === "number" ? (
                        <p>
                          <span className="font-medium text-slate-900">
                            {systemCopy.operator.labels.attempt}
                          </span>{" "}
                          {attempt.attemptCount}
                        </p>
                      ) : null}
                      {attempt.providerStatusCode ? (
                        <p>
                          <span className="font-medium text-slate-900">
                            {systemCopy.operator.labels.providerStatusCode}
                          </span>{" "}
                          {attempt.providerStatusCode}
                        </p>
                      ) : null}
                      {attempt.nextRetryAt ? (
                        <p>
                          <span className="font-medium text-slate-900">
                            {systemCopy.operator.labels.nextRetryAt}
                          </span>{" "}
                          {formatDateTime(attempt.nextRetryAt)}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-medium text-slate-900">
                          {systemCopy.operator.labels.message}
                        </span>{" "}
                        {attempt.message ?? systemCopy.operator.attemptMessageEmpty}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="전달 연결 상태">
        <div className="grid gap-3 md:grid-cols-3">
          {senderRegistry.map((entry) => (
            <article
              key={`provider-readiness-${entry.channel}`}
              className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip label={entry.channel} tone="quiet" />
                <StatusChip
                  label={
                    entry.enablement === "provider_enabled"
                      ? "Provider 활성 준비"
                      : entry.enablement === "provider_disabled"
                        ? "Provider 비활성"
                        : "noop"
                  }
                  tone="quiet"
                />
                <StatusChip
                  label={entry.mode === "provider" ? "실제 Provider 단계" : "연결 전 미리보기"}
                  tone="quiet"
                />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">현재 경로</span>{" "}
                  {entry.activeProviderKey}
                </p>
                <p>
                  <span className="font-medium text-slate-900">다음 연결 후보</span>{" "}
                  {entry.futureProviderKey}
                </p>
                <p>
                  <span className="font-medium text-slate-900">비밀값 준비</span>{" "}
                  {entry.providerConfigured ? "준비됨" : "아직 없음"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">안전한 fallback</span>{" "}
                  {entry.enablement === "provider_enabled"
                    ? "provider-stub 경로로 유지"
                    : entry.providerReady
                      ? "noop 경로로 안전하게 머무름"
                      : "noop 전용 채널"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">사전 점검</span>{" "}
                  {entry.preflightReady ? "준비됨" : "점검 필요"}
                </p>
                {entry.missingSecrets.length ? (
                  <p>
                    <span className="font-medium text-slate-900">필요한 비밀값</span>{" "}
                    {entry.missingSecrets.join(", ")}
                  </p>
                ) : null}
                {entry.preflightWarnings.length ? (
                  <p>
                    <span className="font-medium text-slate-900">점검 메모</span>{" "}
                    {entry.preflightWarnings.join(", ")}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={systemCopy.operator.deliveryGroupsTitle}>
        {!deliveryEvents.length ? (
          <p className="text-sm leading-7 text-slate-600">{systemCopy.operator.deliveryEmpty}</p>
        ) : (
          <div className="grid gap-5">
            {retryableBacklogSummary.total ? (
              <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip
                    label={systemCopy.operator.retryableBacklogTitle}
                    tone="quiet"
                  />
                  <StatusChip
                    label={`${systemCopy.operator.retryableBacklogLabels.total} ${retryableBacklogSummary.total}`}
                    tone="quiet"
                  />
                  <StatusChip
                    label={`${systemCopy.operator.retryableBacklogLabels.dueNow} ${retryableBacklogSummary.dueNowCount}`}
                    tone="quiet"
                  />
                  <StatusChip
                    label={`${systemCopy.operator.retryableBacklogLabels.waiting} ${retryableBacklogSummary.waitingCount}`}
                    tone="quiet"
                  />
                  {retryableBacklogDrilldown.byProvider.map((bucket) => (
                    <StatusChip
                      key={`retryable-backlog-provider-${bucket.key}`}
                      label={`?꾨떖 ?쒓났??${bucket.key} ${bucket.total} / 吏湲?${bucket.dueNow}`}
                      tone="quiet"
                    />
                  ))}
                  {retryableBacklogDrilldown.byRetryCategory.map((bucket) => (
                    <StatusChip
                      key={`retryable-backlog-category-${bucket.key}`}
                      label={`?ㅼ떆 ?쒕룄 ?댁쑀 ${
                        systemCopy.operator.retryCategoryLabels[
                          bucket.key as NotificationProviderRetryCategory
                        ]
                      } ${bucket.total} / 吏湲?${bucket.dueNow}`}
                      tone="quiet"
                    />
                  ))}
                  {retryableBacklogDrilldown.byChannel.map((bucket) => (
                    <StatusChip
                      key={`retryable-backlog-${bucket.key}`}
                      label={`梨꾨꼸 ${bucket.key} ${bucket.total} / ?湲?${bucket.waiting}`}
                      tone="quiet"
                    />
                  ))}
                </div>
                {retryableBacklogSummary.nextRetryAt ? (
                  <p className="mt-3 text-sm text-slate-700">
                    <span className="font-medium text-slate-900">
                      {systemCopy.operator.labels.nextRetryAt}
                    </span>{" "}
                    {formatDateTime(retryableBacklogSummary.nextRetryAt)}
                  </p>
                ) : null}
              </article>
            ) : null}
            {deliveryGroups.map((group) =>
              group.items.length ? (
                <div key={group.key} className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <StatusChip label={group.title} tone="quiet" />
                    <span className="text-xs text-slate-500">{group.items.length}</span>
                    {group.key === "retryable" || group.key === "failed" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          applyDeliveryControl(
                            "requeue",
                            resolveActionableEventIds(
                              group.items.map((event) => event.id),
                              selectedDeliveryEventIds
                            )
                          )
                        }
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {pending
                          ? systemCopy.operator.requeueing
                          : systemCopy.operator.batchRequeue}
                      </button>
                    ) : null}
                    {group.key === "expired" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          applyDeliveryControl(
                            "release_expired_claim",
                            resolveActionableEventIds(
                              group.items.map((event) => event.id),
                              selectedDeliveryEventIds
                            )
                          )
                        }
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {pending
                          ? systemCopy.operator.releasingClaim
                          : systemCopy.operator.batchReleaseClaim}
                      </button>
                    ) : null}
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
                            {control ? (
                              <label className="flex items-center gap-2 text-xs text-slate-500">
                                <input
                                  type="checkbox"
                                  checked={selectedDeliveryEventIds.includes(event.id)}
                                  disabled={pending}
                                  onChange={() =>
                                    setSelectedDeliveryEventIds((current) =>
                                      toggleSelectedIds(current, event.id)
                                    )
                                  }
                                />
                                {systemCopy.operator.selectedRetryLabel}
                              </label>
                            ) : null}
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
                                onClick={() => applyDeliveryControl(control.action, [event.id])}
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

