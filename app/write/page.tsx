import type {
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason
} from "@/lib/domain/types";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { ModerationFeedbackCard } from "@/features/moderation/moderation-feedback-card";
import { WriteForm } from "@/features/write/write-form";
import { systemCopy } from "@/lib/copy/system-copy";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getPrivateResonanceWaveDraftPrefill } from "@/lib/services/private-resonance-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type WritePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WritePage({ searchParams }: WritePageProps) {
  const viewer = await getViewerContext();
  const approvedViewer = await enforceApprovedViewerPageAccess({ viewer, nextPath: "/write" });

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;
  const sourceTraceId = typeof params.sourceTraceId === "string" ? params.sourceTraceId : null;
  const traceDraft = sourceTraceId
    ? await getPrivateResonanceWaveDraftPrefill(sourceTraceId, approvedViewer.userId)
    : null;
  const action = typeof params.action === "string" ? params.action : null;
  const targetType =
    typeof params.targetType === "string" && params.targetType === "post_title"
      ? "post_title"
      : "post_body";
  const reasons =
    typeof params.reasons === "string"
      ? params.reasons
          .split(",")
          .map((reason) => reason.trim())
          .filter(Boolean)
      : [];
  const guidanceFamily =
    typeof params.guidanceFamily === "string" ? params.guidanceFamily : null;

  return (
    <div className="grid gap-6">
      <PageHeader title={systemCopy.write.title} description={systemCopy.write.description} />
      <SectionCard>
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error === "content-hard-block"
              ? "이 글은 지금 흐름에 바로 올리기 어렵다고 판단됐어요. 노출 식별자나 강한 공격 표현을 조금 덜어 다시 남겨 주세요."
              : "본문은 20자 이상으로 남겨 주세요."}
          </p>
        ) : null}
        {error === "content-hard-block" && action === "hard_block" && reasons.length ? (
          <div className="mb-4">
            <ModerationFeedbackCard
              targetType={targetType}
              action="hard_block"
              reasons={reasons as ContentGuardrailReason[]}
              guidanceFamily={guidanceFamily as ContentGuardrailGuidanceFamily | null}
              retryAttempted
              retrySucceeded={false}
              title="방금 안내가 너무 차갑거나 헷갈렸다면 짧게 남겨주세요"
              description="이 의견은 베타 moderation 조정에만 쓰여요. 글 내용은 자동으로 바뀌지 않아요."
            />
          </div>
        ) : null}
        {sourceTraceId && !traceDraft ? (
          <p className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            이 잔상은 현재 계정에서 파도 초안으로 열 수 없어요.
          </p>
        ) : null}
        <WriteForm
          initialTitle={traceDraft?.sourcePostTitle ? `남은 결: ${traceDraft.sourcePostTitle}` : null}
          initialBody={traceDraft?.body ?? null}
          sourceTraceMode={Boolean(traceDraft)}
        />
      </SectionCard>
    </div>
  );
}
