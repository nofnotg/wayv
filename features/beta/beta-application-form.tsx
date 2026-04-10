"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

type BetaApplicationFormProps = {
  initialEmail?: string;
  initialName?: string;
  currentStatus?: "pending" | "approved" | "rejected" | "revoked" | null;
};

export function BetaApplicationForm({
  initialEmail = "",
  initialName = "",
  currentStatus = null
}: BetaApplicationFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [applicantName, setApplicantName] = useState(initialName);
  const [applicationNote, setApplicationNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const helperCopy =
    currentStatus === "approved"
      ? "이미 승인된 계정이에요. 메모를 다시 남기면 운영자가 현재 상태를 함께 확인할 수 있어요."
      : currentStatus === "rejected"
        ? "이번에는 보류되었지만, 메모를 보완해서 다시 신청할 수 있어요."
        : currentStatus === "revoked"
          ? "현재 접근은 멈춘 상태예요. 운영 확인이 필요하면 메모를 남겨 주세요."
          : "왜 wayv를 써 보고 싶은지, 지금 어떤 상황인지 짧게 남겨 주세요.";

  const submit = () => {
    startTransition(async () => {
      setError(null);
      setMessage(null);

      const response = await fetch("/api/beta/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          applicantName,
          applicationNote
        })
      });

      const data = (await response.json().catch(() => null)) as
        | { access?: { status: string }; error?: string }
        | null;

      if (!response.ok) {
        setError("신청 내용을 다시 확인해 주세요. 메모는 8자 이상으로 남겨야 해요.");
        return;
      }

      const nextStatus = data?.access?.status;
      setMessage(
        nextStatus === "approved"
          ? "이미 승인된 계정으로 확인되었어요. 바로 홈으로 돌아가서 이용할 수 있어요."
          : "신청이 접수되었어요. 승인 전까지는 대기 화면만 보이게 돼요."
      );
      setApplicationNote("");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-900" htmlFor="beta-email">
          이메일
        </label>
        <input
          id="beta-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
          placeholder="you@example.com"
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-900" htmlFor="beta-name">
          이름 또는 닉네임
        </label>
        <input
          id="beta-name"
          type="text"
          value={applicantName}
          onChange={(event) => setApplicantName(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
          placeholder="어떻게 불러 드리면 좋을까요?"
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-900" htmlFor="beta-note">
          신청 메모
        </label>
        <textarea
          id="beta-note"
          value={applicationNote}
          onChange={(event) => setApplicationNote(event.target.value)}
          className="min-h-40 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-cyan-500"
          placeholder="실패 경험을 어떻게 나누고 싶은지, 지금 필요한 분위기가 어떤지 남겨 주세요."
          disabled={pending}
        />
        <p className="text-xs leading-6 text-slate-500">{helperCopy}</p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "신청 보내는 중..." : "베타 신청 보내기"}
        </button>
      </div>
    </div>
  );
}
