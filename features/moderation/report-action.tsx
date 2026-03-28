"use client";

import { useMemo, useState, useTransition } from "react";

import type {
  ModerationReportReason,
  ModerationReportTargetType
} from "@/lib/domain/types";
import { systemCopy } from "@/lib/copy/system-copy";

type ReportActionProps = {
  targetType: ModerationReportTargetType;
  targetId: string;
  isAuthenticated: boolean;
  compact?: boolean;
  disabled?: boolean;
};

export function ReportAction({
  targetType,
  targetId,
  isAuthenticated,
  compact = false,
  disabled = false
}: ReportActionProps) {
  const [reasonKey, setReasonKey] = useState<ModerationReportReason>("harmful_expression");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const endpoint = useMemo(
    () => (targetType === "post" ? `/api/posts/${targetId}/report` : `/api/comments/${targetId}/report`),
    [targetId, targetType]
  );

  const triggerLabel =
    targetType === "post" ? systemCopy.reporting.triggerPost : systemCopy.reporting.triggerComment;

  const submitReport = () => {
    if (!isAuthenticated) {
      setMessage(systemCopy.reporting.signInPrompt);
      return;
    }

    startTransition(async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reasonKey,
          note: note.trim() ? note.trim() : null
        })
      });

      if (!response.ok) {
        setMessage("아직 운영 흐름에 남기지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        return;
      }

      setMessage(systemCopy.reporting.success);
      setNote("");
    });
  };

  return (
    <details className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <summary className="cursor-pointer list-none text-sm text-slate-600">{triggerLabel}</summary>
      <div className="mt-4 grid gap-3">
        <p className="text-sm text-slate-600">{systemCopy.reporting.description}</p>
        <select
          value={reasonKey}
          onChange={(event) => setReasonKey(event.target.value as ModerationReportReason)}
          disabled={pending || disabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {Object.entries(systemCopy.reporting.reasons).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <textarea
          rows={compact ? 2 : 3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={pending || disabled}
          placeholder={systemCopy.reporting.notePlaceholder}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={submitReport}
          disabled={pending || disabled}
          className="w-fit rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? systemCopy.reporting.saving : systemCopy.reporting.submit}
        </button>
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </div>
    </details>
  );
}
