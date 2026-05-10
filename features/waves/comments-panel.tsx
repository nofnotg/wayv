"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ModerationFeedbackCard } from "@/features/moderation/moderation-feedback-card";
import { ReportAction } from "@/features/moderation/report-action";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason,
  ContentGuardrailTargetType,
  WaveComment
} from "@/lib/domain/types";
import { COMMENT_MAX_LENGTH } from "@/lib/validation/schemas";
import { formatDateTime } from "@/lib/utils";

type CommentsPanelProps = {
  postId: string;
  isAuthenticated: boolean;
  initialComments: WaveComment[];
  interactionsEnabled: boolean;
};

const commentLimitHelp =
  "댓글은 120자까지 남길 수 있어요. 길어진 마음은 당신의 파도로 옮겨도 괜찮아요.";
const commentAdviceGuidance =
  "이 말은 조언처럼 닿을 수 있어요. 공감에 가까운 말로 다시 남겨볼까요?";
const invalidCommentCopy = "짧은 말은 2자 이상 120자 이하로 남겨 주세요.";

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
  const [notice, setNotice] = useState<string | null>(null);
  const [moderationFeedbackState, setModerationFeedbackState] = useState<{
    targetType: ContentGuardrailTargetType;
    targetId?: string | null;
    action: "allow_with_guidance" | "soft_hold" | "safety_hold" | "hard_block";
    reasons: ContentGuardrailReason[];
    guidanceFamily?: ContentGuardrailGuidanceFamily | null;
    retryAttempted?: boolean;
    retrySucceeded?: boolean | null;
  } | null>(null);
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
        if (data?.moderation?.action) {
          setModerationFeedbackState({
            targetType: data.moderation.targetType,
            targetId: null,
            action: data.moderation.action,
            reasons: data.moderation.reasons ?? [],
            guidanceFamily: data.moderation.guidance?.family ?? null,
            retryAttempted: true,
            retrySucceeded: false
          });
        }
        if (data?.moderation?.guidance?.description) {
          setError(data.moderation.guidance.description);
          return;
        }
        setError(
          data?.error === "invalid-comment"
            ? invalidCommentCopy
            : data?.error === "comment-guidance"
              ? commentAdviceGuidance
              : data?.error === "interactions-paused"
                ? systemCopy.moderation.interactionsPaused
                : systemCopy.comments.saveError
        );
        return;
      }

      const data = await response.json();
      setComments(data.comments);
      setBody("");
      setError(null);
      setNotice(null);
      setModerationFeedbackState(null);
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
              maxLength={COMMENT_MAX_LENGTH}
              placeholder={systemCopy.comments.placeholder}
              className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm"
            />
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>{commentLimitHelp}</span>
              <span>
                {body.length}/{COMMENT_MAX_LENGTH}
              </span>
            </div>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            {notice ? <p className="text-sm text-amber-700">{notice}</p> : null}
            {moderationFeedbackState ? (
              <ModerationFeedbackCard
                targetType={moderationFeedbackState.targetType}
                targetId={moderationFeedbackState.targetId}
                action={moderationFeedbackState.action}
                reasons={moderationFeedbackState.reasons}
                guidanceFamily={moderationFeedbackState.guidanceFamily}
                retryAttempted={moderationFeedbackState.retryAttempted}
                retrySucceeded={moderationFeedbackState.retrySucceeded}
                title="방금 안내가 어땠는지 짧게 알려주세요"
                description="댓글 흐름을 더 조용하게 다듬는 참고로만 사용됩니다."
              />
            ) : null}
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
