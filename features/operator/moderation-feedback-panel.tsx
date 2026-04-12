"use client";

import { useMemo, useState } from "react";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import type {
  ContentGuardrailAction,
  ContentGuardrailReason,
  ContentGuardrailTargetType,
  ModerationFeedback
} from "@/lib/domain/types";
import { formatDateTimeWithSeconds } from "@/lib/utils";

type ModerationFeedbackPanelProps = {
  initialFeedback: ModerationFeedback[];
};

const actionOptions: Array<ContentGuardrailAction | "all"> = [
  "all",
  "allow_with_guidance",
  "soft_hold",
  "safety_hold",
  "hard_block"
];

const targetOptions: Array<ContentGuardrailTargetType | "all"> = [
  "all",
  "post_title",
  "post_body",
  "comment_body",
  "beta_application_note",
  "profile_bio",
  "feedback_message"
];

function renderActionLabel(action: ContentGuardrailAction | "all") {
  switch (action) {
    case "all":
      return "전체 조치";
    case "allow_with_guidance":
      return "안내 후 통과";
    case "soft_hold":
      return "운영 확인";
    case "safety_hold":
      return "안전 확인";
    case "hard_block":
      return "즉시 차단";
    default:
      return action;
  }
}

function renderTargetLabel(targetType: ContentGuardrailTargetType | "all") {
  switch (targetType) {
    case "all":
      return "전체 입력";
    case "post_title":
      return "글 제목";
    case "post_body":
      return "글 본문";
    case "comment_body":
      return "댓글";
    case "beta_application_note":
      return "베타 신청 메모";
    case "profile_bio":
      return "프로필 소개";
    case "feedback_message":
      return "피드백 메시지";
    default:
      return targetType;
  }
}

function renderReasonLabel(reason: ContentGuardrailReason) {
  switch (reason) {
    case "privacy_exposure":
      return "개인정보 노출";
    case "spam_or_external_pull":
      return "외부 유도";
    case "explicit_profanity":
      return "직설적 욕설";
    case "ridicule_or_mockery":
      return "비웃음";
    case "blame_or_attack":
      return "비난/공격";
    case "unsolicited_advice":
      return "원치 않은 조언";
    case "harsh_tone":
      return "거친 톤";
    case "crisis_signal":
      return "위기 신호";
    case "evasion_pattern":
      return "회피 표현";
    default:
      return reason;
  }
}

function renderChoiceLabel(choice: ModerationFeedback["choice"]) {
  switch (choice) {
    case "understood":
      return "이해됐어요";
    case "felt_too_strict":
      return "조금 엄격했어요";
    case "still_confusing":
      return "아직 헷갈려요";
    case "tone_felt_okay":
      return "톤은 괜찮았어요";
    case "tone_felt_cold":
      return "톤이 차갑게 느껴졌어요";
    case "felt_necessary":
      return "이 조치는 필요했어요";
  }
}

function buildRawLines(rows: ModerationFeedback[]) {
  return rows
    .map(
      (row) =>
        `${formatDateTimeWithSeconds(row.createdAt)} | ${renderActionLabel(row.action)} | ${renderTargetLabel(row.targetType)} | ${renderChoiceLabel(row.choice)} | ${row.userLabel ?? "guest"} | ${row.reasons.map(renderReasonLabel).join("/")}${row.freeText ? ` | ${row.freeText}` : ""}`
    )
    .join("\n");
}

function buildTsv(rows: ModerationFeedback[]) {
  const header = [
    "created_at",
    "user_id",
    "target_type",
    "action",
    "reasons",
    "choice",
    "free_text",
    "path"
  ].join("\t");

  const lines = rows.map((row) =>
    [
      row.createdAt,
      row.userId ?? "",
      row.targetType,
      row.action,
      row.reasons.join("|"),
      row.choice,
      row.freeText ?? "",
      row.path ?? ""
    ].join("\t")
  );

  return [header, ...lines].join("\n");
}

function buildBulletSummary(rows: ModerationFeedback[]) {
  return rows
    .map((row) => {
      const feedbackTone = row.freeText ? ` / ${row.freeText}` : "";
      return `- ${renderChoiceLabel(row.choice)} / ${renderActionLabel(row.action)} / ${renderTargetLabel(row.targetType)} / ${row.reasons.map(renderReasonLabel).join(", ")}${feedbackTone}`;
    })
    .join("\n");
}

export function ModerationFeedbackPanel({ initialFeedback }: ModerationFeedbackPanelProps) {
  const [actionFilter, setActionFilter] = useState<ContentGuardrailAction | "all">("all");
  const [targetFilter, setTargetFilter] = useState<ContentGuardrailTargetType | "all">("all");
  const [hasTextFilter, setHasTextFilter] = useState<"all" | "with_text" | "choice_only">("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const availableReasons = useMemo(
    () => [...new Set(initialFeedback.flatMap((item) => item.reasons))].sort(),
    [initialFeedback]
  );

  const filteredFeedback = useMemo(() => {
    return initialFeedback.filter((item) => {
      if (actionFilter !== "all" && item.action !== actionFilter) {
        return false;
      }
      if (targetFilter !== "all" && item.targetType !== targetFilter) {
        return false;
      }
      if (hasTextFilter === "with_text" && !item.freeText) {
        return false;
      }
      if (hasTextFilter === "choice_only" && item.freeText) {
        return false;
      }
      if (reasonFilter !== "all" && !item.reasons.includes(reasonFilter as ContentGuardrailReason)) {
        return false;
      }
      if (userFilter.trim()) {
        const needle = userFilter.trim().toLowerCase();
        if (!(item.userLabel ?? "").toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [actionFilter, hasTextFilter, initialFeedback, reasonFilter, targetFilter, userFilter]);

  const selectedRows = useMemo(() => {
    const selected = filteredFeedback.filter((item) => selectedIds.includes(item.id));
    return selected.length ? selected : filteredFeedback;
  }, [filteredFeedback, selectedIds]);

  const copyText = async (value: string, notice: string) => {
    await navigator.clipboard.writeText(value);
    setCopyNotice(notice);
  };

  return (
    <SectionCard title="moderation feedback">
      <div className="grid gap-4">
        <p className="text-sm leading-7 text-slate-600">
          moderation 직후에 남긴 반응만 모아 봅니다. 선택만 남긴 경우와 짧은 자유 텍스트를 남긴 경우를 함께 구분할 수 있어요.
        </p>

        <div className="flex flex-wrap gap-2">
          <select
            value={actionFilter}
            onChange={(event) =>
              setActionFilter(event.target.value as ContentGuardrailAction | "all")
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            {actionOptions.map((option) => (
              <option key={option} value={option}>
                {renderActionLabel(option)}
              </option>
            ))}
          </select>
          <select
            value={targetFilter}
            onChange={(event) =>
              setTargetFilter(event.target.value as ContentGuardrailTargetType | "all")
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            {targetOptions.map((option) => (
              <option key={option} value={option}>
                {renderTargetLabel(option)}
              </option>
            ))}
          </select>
          <select
            value={reasonFilter}
            onChange={(event) => setReasonFilter(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            <option value="all">전체 이유</option>
            {availableReasons.map((reason) => (
              <option key={reason} value={reason}>
                {renderReasonLabel(reason)}
              </option>
            ))}
          </select>
          <select
            value={hasTextFilter}
            onChange={(event) => setHasTextFilter(event.target.value as typeof hasTextFilter)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            <option value="all">전체 메모</option>
            <option value="with_text">자유 텍스트 있음</option>
            <option value="choice_only">선택만 남김</option>
          </select>
          <input
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            placeholder="user id filter"
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip label={`filtered ${filteredFeedback.length}`} tone="quiet" />
          <StatusChip label={`selected ${selectedIds.length || filteredFeedback.length}`} tone="quiet" />
          <button
            type="button"
            onClick={() => setSelectedIds(filteredFeedback.map((item) => item.id))}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700"
          >
            현재 목록 전체 선택
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700"
          >
            선택 해제
          </button>
          <button
            type="button"
            onClick={() => copyText(buildRawLines(selectedRows), "원문형 복사본을 준비했어요.")}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700"
          >
            raw copy
          </button>
          <button
            type="button"
            onClick={() => copyText(buildTsv(selectedRows), "TSV 복사본을 준비했어요.")}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700"
          >
            TSV copy
          </button>
          <button
            type="button"
            onClick={() => copyText(buildBulletSummary(selectedRows), "요약 bullet 복사본을 준비했어요.")}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700"
          >
            summary copy
          </button>
        </div>

        {copyNotice ? <p className="text-xs text-slate-500">{copyNotice}</p> : null}

        <div className="grid gap-3">
          {filteredFeedback.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() =>
                      setSelectedIds((current) =>
                        current.includes(item.id)
                          ? current.filter((value) => value !== item.id)
                          : [...current, item.id]
                      )
                    }
                  />
                  select
                </label>
                <StatusChip label={renderActionLabel(item.action)} tone="quiet" />
                <StatusChip label={renderTargetLabel(item.targetType)} tone="quiet" />
                <StatusChip label={renderChoiceLabel(item.choice)} tone="quiet" />
                {item.freeText ? (
                  <StatusChip label="free text" tone="active" />
                ) : (
                  <StatusChip label="choice only" tone="quiet" />
                )}
                <span className="text-xs text-slate-500">
                  {formatDateTimeWithSeconds(item.createdAt)}
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">user</span> {item.userLabel ?? "guest"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">reasons</span>{" "}
                  {item.reasons.map(renderReasonLabel).join(", ")}
                </p>
                {item.guidanceFamily ? (
                  <p>
                    <span className="font-medium text-slate-900">guidance</span> {item.guidanceFamily}
                  </p>
                ) : null}
                {item.path ? (
                  <p>
                    <span className="font-medium text-slate-900">path</span> {item.path}
                  </p>
                ) : null}
                <p>
                  <span className="font-medium text-slate-900">retry</span>{" "}
                  {item.retryAttempted ? (item.retrySucceeded ? "retried + recovered" : "retried" ) : "not retried"}
                </p>
                {item.freeText ? (
                  <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 leading-7">
                    {item.freeText}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
