"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";

const feedbackCategories = [
  { key: "bug", label: "버그" },
  { key: "confusing", label: "헷갈림" },
  { key: "suggestion", label: "제안" },
  { key: "emotional_discomfort", label: "정서적 불편" },
  { key: "exit_reason", label: "나가고 싶은 이유" }
] as const;

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

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setStatusMessage(
          data?.error === "invalid-feedback"
            ? "내용을 조금 더 구체적으로 적어 주세요."
            : "지금은 피드백을 남기지 못했어요. 잠시 후 다시 시도해 주세요."
        );
        return;
      }

      setMessage("");
      setContactEmail("");
      setStatusMessage("고맙습니다. 조용히 검토해서 다음 개선에 반영할게요.");
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
          placeholder="어떤 점이 불편했는지, 어디에서 멈칫했는지 편하게 적어 주세요."
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
            로그인하지 않아도 남길 수 있고, 남긴 이유가 바로 공개되지는 않습니다.
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
