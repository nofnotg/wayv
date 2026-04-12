"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";

const feedbackCategories = [
  { key: "bug", label: "버그" },
  { key: "confusing", label: "헷갈림" },
  { key: "suggestion", label: "제안" },
  { key: "emotional_discomfort", label: "정서적 불편" },
  { key: "exit_reason", label: "그만두고 싶은 이유" }
] as const;

type FeedbackResponse = {
  error?: string;
  moderation?: {
    guidance?: {
      description?: string;
    };
  };
};

export function FeedbackForm() {
  const pathname = usePathname();
  const [category, setCategory] = useState<(typeof feedbackCategories)[number]["key"]>("suggestion");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      setStatusMessage(null);
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category,
          message,
          pagePath: pathname ?? "/feedback",
          contactEmail: contactEmail.trim() || null
        })
      });

      const data = (await response.json().catch(() => null)) as FeedbackResponse | null;
      if (!response.ok) {
        setStatusMessage(
          data?.moderation?.guidance?.description ??
            (data?.error === "invalid-feedback"
              ? "조금 더 구체적으로 남겨 주세요."
              : "지금은 피드백을 남기지 못했어요. 잠시 뒤에 다시 시도해 주세요.")
        );
        return;
      }

      setMessage("");
      setContactEmail("");
      setStatusMessage(
        data?.moderation?.guidance?.description ??
          "고맙습니다. 조용히 검토해서 다음 개선에 반영할게요."
      );
    });
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {feedbackCategories.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setCategory(item.key)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                category === item.key
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="어디가 불편했는지, 어디에서 멈췄는지 편하게 적어 주세요."
          className="min-h-40 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400"
        />
        <input
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          placeholder="답을 받아도 괜찮다면 이메일을 남겨 주세요. 선택 사항입니다."
          className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs leading-6 text-slate-500">
            로그인한 상태에서만 남길 수 있고, 내용이 바로 공개되지는 않아요.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {pending ? "남기는 중..." : "피드백 남기기"}
          </button>
        </div>
        {statusMessage ? (
          <p className="rounded-[1.25rem] border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
