"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { getActiveOnboardingQuestions } from "@/lib/config/onboarding-questions";
import type { OnboardingAnswer, OnboardingQuestion } from "@/lib/domain/types";
import { systemCopy } from "@/lib/copy/system-copy";

type AnswerMap = Record<string, OnboardingAnswer["value"]>;

function buildAnswers(questions: OnboardingQuestion[], values: AnswerMap): OnboardingAnswer[] {
  return questions.map((question) => {
    const value = values[question.key];

    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
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

export function OnboardingForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const activeQuestions = useMemo(() => {
    const normalized = Object.entries(answers).map(([questionKey, value]) => ({
      questionKey,
      value
    }));

    return getActiveOnboardingQuestions(normalized);
  }, [answers]);

  const updateSingleValue = (questionKey: string, value: OnboardingAnswer["value"]) => {
    setAnswers((current) => ({ ...current, [questionKey]: value }));
  };

  const toggleMultiValue = (questionKey: string, value: string) => {
    setAnswers((current) => {
      const currentValue = current[questionKey];
      const currentValues = Array.isArray(currentValue) ? [...currentValue] : [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...current, [questionKey]: nextValues };
    });
  };

  const handleSubmit = () => {
    const payload = buildAnswers(activeQuestions, answers);
    const missingRequired = activeQuestions.some((question) => {
      if (question.allowSkip) {
        return false;
      }

      const value = answers[question.key];
      return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    });

    if (missingRequired) {
      setError("답하지 않은 질문이 있어요. 건너뛸 수 있는 질문만 비워 둘 수 있어요.");
      return;
    }

    setError(null);
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

      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6">
      {activeQuestions.map((question) => (
        <div key={question.key} className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
          <h2 className="font-serif text-2xl text-slate-950">{question.title}</h2>
          {question.subtitle ? <p className="mt-2 text-sm text-slate-600">{question.subtitle}</p> : null}
          <div className="mt-4">
            {question.type === "single_choice" ? (
              <div className="grid gap-3">
                {question.options?.map((option) => (
                  <label
                    key={option.key}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <input
                      type="radio"
                      name={question.key}
                      checked={answers[question.key] === option.key}
                      onChange={() => updateSingleValue(question.key, option.key)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {question.type === "multi_choice" ? (
              <div className="grid gap-3">
                {question.options?.map((option) => {
                  const currentValue = answers[question.key];
                  const selected = Array.isArray(currentValue)
                    ? currentValue.includes(option.key)
                    : false;

                  return (
                    <label
                      key={option.key}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMultiValue(question.key, option.key)}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}

            {question.type === "scale" ? (
              (() => {
                const currentValue = answers[question.key];
                const rangeValue =
                  typeof currentValue === "number" ? currentValue : (question.min ?? 1);

                return (
                  <div className="grid gap-3">
                    <input
                      type="range"
                      min={question.min}
                      max={question.max}
                      step={question.step}
                      value={rangeValue}
                      onChange={(event) => updateSingleValue(question.key, Number(event.target.value))}
                    />
                    <p className="text-sm text-slate-600">현재 선택: {rangeValue}</p>
                  </div>
                );
              })()
            ) : null}

            {question.type === "short_text" ? (
              (() => {
                const currentValue = answers[question.key];
                const textValue = typeof currentValue === "string" ? currentValue : "";

                return (
                  <textarea
                    rows={4}
                    value={textValue}
                    onChange={(event) => updateSingleValue(question.key, event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder={question.placeholder}
                  />
                );
              })()
            ) : null}
          </div>
        </div>
      ))}

      {error ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? systemCopy.onboarding.saving : systemCopy.onboarding.submit}
      </button>
    </div>
  );
}
