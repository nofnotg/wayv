"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";

import { systemCopy } from "@/lib/copy/system-copy";
import type { PrivateResonanceChoice, PrivateResonanceTrace } from "@/lib/domain/types";

type PrivateResonanceCardProps = {
  postId: string;
  isAuthenticated: boolean;
  initialTrace: PrivateResonanceTrace | null;
};

const choiceOrder: PrivateResonanceChoice[] = [
  "passed_by",
  "touched_lightly",
  "lingered",
  "felt_like_mine",
  "not_sure_yet"
];

export function PrivateResonanceCard({
  postId,
  isAuthenticated,
  initialTrace
}: PrivateResonanceCardProps) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<PrivateResonanceChoice | null>(
    initialTrace?.resonanceChoice ?? null
  );
  const [privateNote, setPrivateNote] = useState(initialTrace?.privateNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const saveTrace = () => {
    if (!isAuthenticated) {
      setMessage(systemCopy.privateResonance.signInPrompt);
      return;
    }

    if (!choice) {
      setMessage(systemCopy.privateResonance.description);
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/posts/${postId}/private-resonance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resonanceChoice: choice,
          privateNote: privateNote.trim() || null,
          sourcePath: pathname ?? `/wave/${postId}`
        })
      });

      if (!response.ok) {
        setMessage(systemCopy.privateResonance.error);
        return;
      }

      const data = (await response.json()) as { trace: PrivateResonanceTrace };
      setChoice(data.trace.resonanceChoice);
      setPrivateNote(data.trace.privateNote ?? "");
      setMessage(systemCopy.privateResonance.saved);
    });
  };

  const clearTrace = () => {
    if (!isAuthenticated) {
      setMessage(systemCopy.privateResonance.signInPrompt);
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/posts/${postId}/private-resonance`, {
        method: "DELETE"
      });

      if (!response.ok) {
        setMessage(systemCopy.privateResonance.error);
        return;
      }

      setChoice(null);
      setPrivateNote("");
      setMessage(systemCopy.privateResonance.cleared);
    });
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="grid gap-1">
        <h2 className="font-serif text-2xl text-slate-950">{systemCopy.privateResonance.title}</h2>
        <p className="text-sm leading-6 text-slate-600">{systemCopy.privateResonance.description}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {choiceOrder.map((item) => {
          const isActive = choice === item;

          return (
            <button
              key={item}
              type="button"
              disabled={pending}
              onClick={() => setChoice(item)}
              className={[
                "rounded-full border px-4 py-2 text-sm transition",
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                pending ? "cursor-not-allowed opacity-70" : ""
              ].join(" ")}
            >
              {systemCopy.privateResonance.choices[item]}
            </button>
          );
        })}
      </div>

      <textarea
        value={privateNote}
        onChange={(event) => setPrivateNote(event.target.value)}
        maxLength={180}
        rows={3}
        placeholder={systemCopy.privateResonance.notePlaceholder}
        className="mt-4 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400"
      />
      <div className="mt-3 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {systemCopy.privateResonance.noteHelp} {privateNote.length}/180
        </span>
        <div className="flex flex-wrap gap-2">
          {initialTrace || choice || privateNote ? (
            <button
              type="button"
              disabled={pending}
              onClick={clearTrace}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {systemCopy.privateResonance.clear}
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending || !choice}
            onClick={saveTrace}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {pending ? systemCopy.privateResonance.saving : systemCopy.privateResonance.save}
          </button>
        </div>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
    </section>
  );
}
