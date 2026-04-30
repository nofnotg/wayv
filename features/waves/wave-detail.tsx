import type {
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason,
  PrivateResonanceTrace,
  WaveDetail as WaveDetailData,
  WaveReactionType
} from "@/lib/domain/types";
import { StatusChip } from "@/components/status-chip";
import { ModerationFeedbackCard } from "@/features/moderation/moderation-feedback-card";
import { systemCopy } from "@/lib/copy/system-copy";
import { formatDateTime } from "@/lib/utils";

import { ReportAction } from "@/features/moderation/report-action";
import { CommentsPanel } from "@/features/waves/comments-panel";
import { PrivateResonanceCard } from "@/features/waves/private-resonance-card";
import { ReactionBar } from "@/features/waves/reaction-bar";

type WaveDetailProps = {
  post: WaveDetailData;
  isAuthenticated: boolean;
  submissionNotice?: string | null;
  moderationFeedback?: {
    targetType: "post_title" | "post_body";
    targetId?: string | null;
    action: "allow_with_guidance" | "soft_hold" | "safety_hold" | "hard_block";
    reasons: ContentGuardrailReason[];
    guidanceFamily?: ContentGuardrailGuidanceFamily | null;
    retryAttempted?: boolean;
    retrySucceeded?: boolean | null;
  } | null;
  reactionCatalog: {
    reactionType: WaveReactionType;
    label: string;
  }[];
  privateResonanceTrace?: PrivateResonanceTrace | null;
};

export function WaveDetail({
  post,
  isAuthenticated,
  submissionNotice = null,
  moderationFeedback = null,
  reactionCatalog,
  privateResonanceTrace = null
}: WaveDetailProps) {
  return (
    <div className="grid gap-6">
      <article className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_64px_rgba(15,23,42,0.07)] backdrop-blur">
        {submissionNotice ? (
          <div className="mb-5 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 px-5 py-4">
            <p className="text-sm leading-7 text-cyan-950">{submissionNotice}</p>
          </div>
        ) : null}
        {post.moderation.title ? (
          <div className="mb-5 rounded-[1.5rem] border border-amber-100 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-950">{post.moderation.title}</p>
            {post.moderation.description ? (
              <p className="mt-2 text-sm leading-7 text-amber-900">{post.moderation.description}</p>
            ) : null}
          </div>
        ) : null}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusChip label={systemCopy.waveStates[post.state]} tone="active" />
          <StatusChip
            label={post.visibility === "public" ? systemCopy.wave.publicLabel : systemCopy.wave.privateLabel}
          />
        </div>
        <h1 className="font-serif text-4xl tracking-tight text-slate-950">
          {post.title ?? systemCopy.wave.untitled}
        </h1>
        <p className="mt-3 text-sm text-slate-500">{formatDateTime(post.createdAt)}</p>
        {post.moderation.contentVisible ? (
          <>
            <div className="mt-6 flex flex-wrap gap-2 text-sm text-slate-600">
              {post.categories.map((category) => (
                <span key={category} className="rounded-full bg-slate-100 px-3 py-1">
                  {category}
                </span>
              ))}
              {post.emotionTags.map((emotion) => (
                <span key={emotion} className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-900">
                  {emotion}
                </span>
              ))}
            </div>
            <div className="mt-8 whitespace-pre-wrap leading-8 text-slate-800">{post.body}</div>
          </>
        ) : (
          <p className="mt-8 text-sm leading-7 text-slate-600">
            {post.moderation.description ?? systemCopy.moderation.removedDescription}
          </p>
        )}
        {post.moderation.canReport ? (
          <div className="mt-6">
            <ReportAction targetType="post" targetId={post.id} isAuthenticated={isAuthenticated} />
          </div>
        ) : null}
        {moderationFeedback ? (
          <div className="mt-6">
            <ModerationFeedbackCard
              targetType={moderationFeedback.targetType}
              targetId={moderationFeedback.targetId}
              action={moderationFeedback.action}
              reasons={moderationFeedback.reasons}
              guidanceFamily={moderationFeedback.guidanceFamily}
              retryAttempted={moderationFeedback.retryAttempted}
              retrySucceeded={moderationFeedback.retrySucceeded}
              title="방금 moderation 안내가 어땠는지 남겨주세요"
              description="post 흐름을 다듬는 베타 참고로만 쓰여요."
            />
          </div>
        ) : null}
      </article>

      {post.moderation.interactionsEnabled ? (
        <>
          <ReactionBar
            postId={post.id}
            isAuthenticated={isAuthenticated}
            initialSummary={post.reactionSummary}
            initialViewerReactionTypes={post.viewerReactionTypes}
            catalog={reactionCatalog}
          />
          <PrivateResonanceCard
            postId={post.id}
            isAuthenticated={isAuthenticated}
            initialTrace={privateResonanceTrace}
          />
        </>
      ) : (
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.07)] backdrop-blur">
          <p className="text-sm text-slate-600">{systemCopy.moderation.interactionsPaused}</p>
        </section>
      )}

      <CommentsPanel
        postId={post.id}
        isAuthenticated={isAuthenticated}
        initialComments={post.comments}
        interactionsEnabled={post.moderation.interactionsEnabled}
      />
    </div>
  );
}
