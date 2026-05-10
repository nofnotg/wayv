import { notFound } from "next/navigation";

import type {
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason
} from "@/lib/domain/types";
import { WaveDetail } from "@/features/waves/wave-detail";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getPrivateResonanceTrace } from "@/lib/services/private-resonance-service";
import { getWaveDetailById } from "@/lib/services/posts-service";
import { getReactionCatalog } from "@/lib/services/reaction-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type WaveDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WaveDetailPage({ params, searchParams }: WaveDetailPageProps) {
  const { id } = await params;
  const viewer = await getViewerContext();
  const approvedViewer = await enforceApprovedViewerPageAccess({ viewer, nextPath: `/wave/${id}` });
  const [post, privateResonanceTrace] = await Promise.all([
    getWaveDetailById(id, approvedViewer.userId),
    getPrivateResonanceTrace(id, approvedViewer.userId).catch((error) => {
      if (error instanceof Error && error.message === "not-found") {
        return null;
      }

      throw error;
    })
  ]);
  const query = (await searchParams) ?? {};

  if (!post) {
    notFound();
  }

  const action =
    typeof query.held === "string"
      ? query.held
      : typeof query.guidance === "string"
        ? "allow_with_guidance"
        : null;
  const targetType =
    typeof query.targetType === "string" && query.targetType === "post_title"
      ? "post_title"
      : "post_body";
  const reasons =
    typeof query.reasons === "string"
      ? query.reasons
          .split(",")
          .map((reason) => reason.trim())
          .filter(Boolean)
      : [];
  const guidanceFamily =
    typeof query.guidanceFamily === "string" ? query.guidanceFamily : null;

  return (
    <WaveDetail
      post={post}
      isAuthenticated
      reactionCatalog={getReactionCatalog()}
      privateResonanceTrace={privateResonanceTrace}
      moderationFeedback={
        action === "allow_with_guidance" || action === "soft_hold" || action === "safety_hold"
          ? {
              targetType,
              targetId: post.id,
              action,
              reasons: reasons as ContentGuardrailReason[],
              guidanceFamily: guidanceFamily as ContentGuardrailGuidanceFamily | null,
              retryAttempted: false,
              retrySucceeded: true
            }
          : null
      }
      submissionNotice={
        typeof query.guidance === "string"
          ? "이 흐름은 공감에 더 가까운 말로 남을 수 있도록 안내를 함께 붙였어요."
          : typeof query.held === "string"
            ? "이 파도는 운영 확인을 위해 잠시 머물러 있어요. 확인이 끝나면 다시 이어질 수 있어요."
            : null
      }
    />
  );
}
