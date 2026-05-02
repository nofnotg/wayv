"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

import { getActiveOnboardingQuestions } from "@/lib/config/onboarding-questions";
import type { OnboardingAnswer, OnboardingQuestion } from "@/lib/domain/types";
import { systemCopy } from "@/lib/copy/system-copy";

type AnswerMap = Record<string, OnboardingAnswer["value"]>;

type OnboardingFormProps = {
  initialQuestions: OnboardingQuestion[];
  nextPath: string;
  previewMode?: boolean;
};

function hasValue(value: OnboardingAnswer["value"] | undefined) {
  return value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0);
}

function buildAnswers(questions: OnboardingQuestion[], values: AnswerMap): OnboardingAnswer[] {
  return questions.map((question) => {
    const value = values[question.key];

    if (!hasValue(value)) {
      return {
        questionKey: question.key,
        value: null,
        skipped: Boolean(question.allowSkip)
      };
    }

    return {
      questionKey: question.key,
      value
    };
  });
}

export function OnboardingForm({
  initialQuestions,
  nextPath,
  previewMode = false
}: OnboardingFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [stepIndex, setStepIndex] = useState(0);

  const activeQuestions = useMemo(() => {
    const normalized = Object.entries(answers).map(([questionKey, value]) => ({
      questionKey,
      value
    }));

    return getActiveOnboardingQuestions(normalized, initialQuestions);
  }, [answers, initialQuestions]);

  const safeStepIndex = Math.min(stepIndex, Math.max(activeQuestions.length - 1, 0));
  const currentQuestion = activeQuestions[safeStepIndex];
  const progress = activeQuestions.length
    ? Math.round(((safeStepIndex + 1) / activeQuestions.length) * 100)
    : 0;

  const updateSingleValue = (questionKey: string, value: OnboardingAnswer["value"]) => {
    setAnswers((current) => ({ ...current, [questionKey]: value }));
    setError(null);
  };

  const handleNext = () => {
    if (!currentQuestion) {
      return;
    }

    if (!currentQuestion.allowSkip && !hasValue(answers[currentQuestion.key])) {
      setError("가장 가까운 선택지를 하나 골라 주세요. 정확하지 않아도 괜찮아요.");
      return;
    }

    setError(null);
    if (safeStepIndex < activeQuestions.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    if (previewMode) {
      router.push("/internal/operator");
      router.refresh();
      return;
    }

    const payload = buildAnswers(activeQuestions, answers);
    startTransition(async () => {
      const response = await fetch("/api/onboarding/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ answers: payload })
      });

      if (!response.ok) {
        setError(systemCopy.onboarding.error);
        return;
      }

      router.push((nextPath || "/") as Route);
      router.refresh();
    });
  };

  if (!currentQuestion) {
    return null;
  }

  const selectedValue = answers[currentQuestion.key];

  return (
    <section className="mt-6 overflow-hidden rounded-[2.5rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_30px_100px_rgba(54,64,54,0.16)] backdrop-blur md:p-8">
      {previewMode ? (
        <div className="mb-5 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
          운영자 검수 모드 · 저장되지 않음
        </div>
      ) : null}

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-xs text-[#7b8478]">
          <span>
            {safeStepIndex + 1} / {activeQuestions.length}
          </span>
          <span>한 번에 하나씩만 볼게요</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e5ded0]">
          <div
            className="h-full rounded-full bg-[#587866] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="min-h-72">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-[#8d806d]">
          wayv onboarding
        </p>
        <h2 className="font-serif text-3xl leading-tight text-[#1e2d26] md:text-5xl">
          {currentQuestion.title}
        </h2>
        {currentQuestion.subtitle ? (
          <p className="mt-4 text-sm leading-7 text-[#667164]">{currentQuestion.subtitle}</p>
        ) : null}

        <div className="mt-8 grid gap-3">
          {currentQuestion.type === "single_choice"
            ? currentQuestion.options?.map((option) => {
                const selected = selectedValue === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => updateSingleValue(currentQuestion.key, option.key)}
                    className={`rounded-[1.5rem] border px-5 py-4 text-left text-sm leading-6 transition ${
                      selected
                        ? "border-[#587866] bg-[#e7f0e8] text-[#1d352a] shadow-[0_14px_34px_rgba(88,120,102,0.16)]"
                        : "border-[#ded5c6] bg-white/75 text-[#4f5c53] hover:border-[#9ead9e] hover:bg-white"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })
            : null}

          {currentQuestion.type === "scale" ? (
            <div className="rounded-[1.5rem] border border-[#ded5c6] bg-white/75 p-5">
              <input
                type="range"
                min={currentQuestion.min}
                max={currentQuestion.max}
                step={currentQuestion.step}
                value={typeof selectedValue === "number" ? selectedValue : currentQuestion.min ?? 1}
                onChange={(event) => updateSingleValue(currentQuestion.key, Number(event.target.value))}
                className="w-full accent-[#587866]"
              />
              <p className="mt-3 text-sm text-[#667164]">
                지금 선택: {typeof selectedValue === "number" ? selectedValue : currentQuestion.min ?? 1}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
          disabled={safeStepIndex === 0 || pending}
          className="rounded-full border border-[#d8d0c1] px-5 py-3 text-sm text-[#5c665f] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={pending}
          className="rounded-full bg-[#17241f] px-6 py-3 text-sm font-medium text-[#fffaf0] shadow-[0_14px_30px_rgba(23,36,31,0.18)] transition hover:bg-[#0f1c17] disabled:cursor-not-allowed disabled:bg-[#8b968f]"
        >
          {pending
            ? systemCopy.onboarding.saving
            : safeStepIndex < activeQuestions.length - 1
              ? "다음 질문"
              : previewMode
                ? "검수 마치기"
                : systemCopy.onboarding.submit}
        </button>
      </div>
    </section>
  );
}
