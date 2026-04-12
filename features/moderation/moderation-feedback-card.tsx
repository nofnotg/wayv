"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type {
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason,
  ContentGuardrailTargetType,
  ModerationFeedbackChoice
} from "@/lib/domain/types";

const moderationFeedbackChoices: Array<{
  key: ModerationFeedbackChoice;
  label: string;
}> = [
  { key: "understood", label: "이해됐어요" },
  { key: "felt_too_strict", label: "조금 엄격했어요" },
  { key: "still_confusing", label: "아직 헷갈려요" },
  { key: "tone_felt_okay", label: "톤은 괜찮았어요" },
  { key: "tone_felt_cold", label: "톤이 차갑게 느껴졌어요" },
  { key: "felt_necessary", label: "이 조치는 필요했어요" }
];

type ModerationFeedbackCardProps = {
  targetType: ContentGuardrailTargetType;
  targetId?: string | null;
  action: "allow_with_guidance" | "soft_hold" | "safety_hold" | "hard_block";
  reasons: ContentGuardrailReason[];
  guidanceFamily?: ContentGuardrailGuidanceFamily | null;
  retryAttempted?: boolean;
  retrySucceeded?: boolean | null;
  title?: string;
  description?: string;
};

export function ModerationFeedbackCard({
  targetType,
  targetId = null,
  action,
  reasons,
  guidanceFamily = null,
  retryAttempted = false,
  retrySucceeded = null,
  title = "이 안내가 어땠는지 짧게 남겨주세요",
  description = "베타에서는 moderation 자체도 함께 다듬고 있어요. 한 번의 선택만으로도 충분해요."
}: ModerationFeedbackCardProps) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ModerationFeedbackChoice | null>(null);
  const [freeText, setFreeText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = useMemo(() => choice !== null && !pending, [choice, pending]);

  const submit = () => {
    if (!choice) {
      setStatusMessage("먼저 가장 가까운 느낌 하나를 골라주세요.");
      return;
    }

    startTransition(async () => {
      setStatusMessage(null);
      const response = await fetch("/api/moderation-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetType,
          targetId,
          action,
          reasons,
          guidanceFamily,
          choice,
          freeText: freeText.trim() || null,
          path: pathname ?? null,
          retryAttempted,
          retrySucceeded
        })
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setStatusMessage(
          data?.error === "invalid-moderation-feedback"
            ? "선택 항목을 다시 확인해 주세요."
            : "지금은 이 의견을 남기지 못했어요. 잠시 후 다시 시도해 주세요."
        );
        return;
      }

      setStatusMessage("고맙습니다. 이 반응은 다음 조정에 바로 참고할게요.");
      setFreeText("");
    });
  };

  return (
    <section className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50/80 px-5 py-4">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-cyan-950">{title}</p>
        <p className="text-xs leading-6 text-cyan-900">{description}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {moderationFeedbackChoices.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={pending}
            onClick={() => setChoice(item.key)}
            className={`rounded-full px-3 py-2 text-xs transition ${
              choice === item.key
                ? "bg-cyan-900 text-white"
                : "border border-cyan-200 bg-white text-cyan-950"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <textarea
        value={freeText}
        onChange={(event) => setFreeText(event.target.value)}
        maxLength={280}
        rows={3}
        placeholder="원하면 짧게 덧붙여 주세요. 길게 쓰지 않아도 괜찮아요."
        className="mt-4 w-full rounded-[1.25rem] border border-cyan-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
      />

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-cyan-900">
        <span>{freeText.length}/280</span>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="rounded-full bg-cyan-900 px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-cyan-300"
        >
          {pending ? "남기는 중..." : "의견 보내기"}
        </button>
      </div>

      {statusMessage ? <p className="mt-3 text-xs leading-6 text-cyan-950">{statusMessage}</p> : null}
    </section>
  );
}
