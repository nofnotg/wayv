import { notFound } from "next/navigation";

import { WaveDetail } from "@/features/waves/wave-detail";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
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
  const post = await getWaveDetailById(id, approvedViewer.userId);
  const query = (await searchParams) ?? {};

  if (!post) {
    notFound();
  }

  return (
    <WaveDetail
      post={post}
      isAuthenticated
      reactionCatalog={getReactionCatalog()}
      submissionNotice={
        typeof query.guidance === "string"
          ? "파도지기가 공감에 가까운 말로 남겨 달라는 안내를 함께 전했어요."
          : typeof query.held === "string"
            ? "이 파도는 운영 확인을 위해 잠시 보류되었어요. 확인이 끝나면 다시 이어질 수 있어요."
            : null
      }
    />
  );
}
