"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { systemCopy } from "@/lib/copy/system-copy";
import type { WaveReactionSummary, WaveReactionType } from "@/lib/domain/types";

type ReactionCatalogEntry = {
  reactionType: WaveReactionType;
  label: string;
};

type ReactionBarProps = {
  postId: string;
  isAuthenticated: boolean;
  initialSummary: WaveReactionSummary[];
  initialViewerReactionTypes: WaveReactionType[];
  catalog: ReactionCatalogEntry[];
};

export function ReactionBar({
  postId,
  isAuthenticated,
  initialSummary,
  initialViewerReactionTypes,
  catalog
}: ReactionBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState(initialSummary);
  const [viewerReactionTypes, setViewerReactionTypes] = useState(initialViewerReactionTypes);
  const [message, setMessage] = useState<string | null>(null);

  const toggleReaction = (reactionType: WaveReactionType) => {
    if (!isAuthenticated) {
      setMessage(systemCopy.reactions.signInPrompt);
      return;
    }

    const isActive = viewerReactionTypes.includes(reactionType);

    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: isActive ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reactionType })
      });

      if (!response.ok) {
        setMessage("반응을 남기지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        return;
      }

      const data = await response.json();
      setSummary(data.summary);
      setViewerReactionTypes(data.viewerReactionTypes);
      setMessage(systemCopy.reactions.saved);
      router.refresh();
    });
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.07)] backdrop-blur">
      <h2 className="font-serif text-2xl text-slate-950">{systemCopy.reactions.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{systemCopy.reactions.description}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {catalog.map((entry) => {
          const isActive = viewerReactionTypes.includes(entry.reactionType);
          const hasAny =
            summary.find((item) => item.reactionType === entry.reactionType)?.hasActivity ?? false;

          return (
            <button
              key={entry.reactionType}
              type="button"
              disabled={pending}
              onClick={() => toggleReaction(entry.reactionType)}
              className={[
                "rounded-full border px-4 py-2 text-sm transition",
                isActive
                  ? "border-cyan-400 bg-cyan-50 text-cyan-900"
                  : hasAny
                    ? "border-slate-300 bg-slate-50 text-slate-700"
                    : "border-slate-200 bg-white text-slate-700",
                pending ? "cursor-not-allowed opacity-70" : "hover:border-slate-400"
              ].join(" ")}
            >
              {entry.label}
            </button>
          );
        })}
      </div>
      {message ? <p className="mt-4 text-sm text-slate-500">{message}</p> : null}
    </section>
  );
}
