"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ReportAction } from "@/features/moderation/report-action";
import { systemCopy } from "@/lib/copy/system-copy";
import type { WaveComment } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils";

type CommentsPanelProps = {
  postId: string;
  isAuthenticated: boolean;
  initialComments: WaveComment[];
  interactionsEnabled: boolean;
};

export function CommentsPanel({
  postId,
  isAuthenticated,
  initialComments,
  interactionsEnabled
}: CommentsPanelProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submitComment = () => {
    if (!isAuthenticated) {
      setError(systemCopy.comments.signInPrompt);
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ body })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          data?.error === "invalid-comment"
            ? "짧은 말은 2자 이상 500자 이하로 남겨 주세요."
            : data?.error === "interactions-paused"
              ? systemCopy.moderation.interactionsPaused
            : "말을 남기지 못했어요. 잠시 뒤 다시 시도해 주세요."
        );
        return;
      }

      const data = await response.json();
      setComments(data.comments);
      setBody("");
      setError(null);
      router.refresh();
    });
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.07)] backdrop-blur">
      <h2 className="font-serif text-2xl text-slate-950">{systemCopy.comments.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{systemCopy.comments.description}</p>

      <div className="mt-6 grid gap-4">
        {comments.length ? (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-800">{comment.authorLabel}</p>
                <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
              </div>
              {comment.moderationNotice ? (
                <p className="mt-3 text-xs leading-6 text-amber-700">{comment.moderationNotice}</p>
              ) : null}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {comment.displayBody}
              </p>
              {comment.canReport ? (
                <div className="mt-4">
                  <ReportAction
                    targetType="comment"
                    targetId={comment.id}
                    isAuthenticated={isAuthenticated}
                    compact
                  />
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            {systemCopy.comments.empty}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-3">
        {interactionsEnabled ? (
          <>
            <textarea
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={systemCopy.comments.placeholder}
              className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm"
            />
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            <button
              type="button"
              onClick={submitComment}
              disabled={pending}
              className="w-fit rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {pending ? systemCopy.comments.saving : systemCopy.comments.submit}
            </button>
          </>
        ) : (
          <p className="rounded-[1.5rem] border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            {systemCopy.moderation.interactionsPaused}
          </p>
        )}
      </div>
    </section>
  );
}
