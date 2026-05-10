"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

import { getActiveOnboardingQuestions } from "@/lib/config/onboarding-questions";
import type { OnboardingAnswer, OnboardingQuestion } from "@/lib/domain/types";
import { systemCopy } from "@/lib/copy/system-copy";

type AnswerMap = Record<string, OnboardingAnswer["value"]>;

const tutorialSlides = [
  {
    eyebrow: "No. i — Horizon",
    title: "말하지 못한 경험이 잠시 표면에 올라오는 곳",
    body: "wayv는 실패를 해결책으로 바꾸지 않습니다. 먼저 조용히 놓일 수 있는 자리를 만듭니다."
  },
  {
    eyebrow: "No. ii — Quiet Paper",
    title: "남은 자리에 여백을 둡니다",
    body: "좋은 답을 찾기보다, 말할 수 있게 된 상태를 먼저 지킵니다."
  },
  {
    eyebrow: "No. iii — Outline",
    title: "다른 파도를 보고 내 안의 윤곽을 봅니다",
    body: "분석이나 진단이 아니라, 설명되지 않은 채로 잠시 머무는 가장자리의 결입니다."
  },
  {
    eyebrow: "No. iv — Quiet Reactions",
    title: "반응은 점수가 아니라 결입니다",
    body: "숫자와 순위 대신, 조용한 문장과 사적인 잔상으로 남깁니다."
  },
  {
    eyebrow: "No. v — The Flow",
    title: "파도는 곁을 지나가게 둡니다",
    body: "이제 몇 가지 짧은 질문으로 처음 만날 파도의 온도를 맞춰볼게요."
  }
];

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
  const [tutorialIndex, setTutorialIndex] = useState(previewMode ? tutorialSlides.length : 0);

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
  const showTutorial = tutorialIndex < tutorialSlides.length;
  const tutorial = tutorialSlides[Math.min(tutorialIndex, tutorialSlides.length - 1)];

  if (showTutorial) {
    return (
      <section className="mt-6 overflow-hidden rounded-[2.5rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_30px_100px_rgba(54,64,54,0.16)] backdrop-blur md:p-8">
        <div className="min-h-[32rem] rounded-[2rem] bg-[linear-gradient(135deg,#fbf4e9_0%,#f1c5b6_48%,#4c86c1_100%)] p-6 text-[#2e2620] md:p-10">
          <div className="flex h-full min-h-[28rem] flex-col justify-between">
            <div>
              <p className="font-serif text-sm italic tracking-[0.22em] text-[#6f6255]">
                {tutorial.eyebrow}
              </p>
              <h2 className="mt-10 max-w-2xl font-serif text-4xl font-light leading-tight text-[#241d18] md:text-6xl">
                {tutorial.title}
              </h2>
              <p className="mt-8 max-w-xl text-base leading-8 text-[#51483f]">{tutorial.body}</p>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                {tutorialSlides.map((slide, index) => (
                  <span
                    key={slide.eyebrow}
                    className={`h-2 rounded-full transition-all ${
                      index === tutorialIndex ? "w-8 bg-[#2e2620]" : "w-2 bg-[#2e2620]/30"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTutorialIndex((current) => current + 1)}
                className="rounded-full bg-[#17241f] px-6 py-3 text-sm font-medium text-[#fffaf0] shadow-[0_14px_30px_rgba(23,36,31,0.18)] transition hover:bg-[#0f1c17]"
              >
                {tutorialIndex < tutorialSlides.length - 1 ? "다음으로" : "질문 시작하기"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
