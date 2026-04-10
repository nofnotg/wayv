import { notFound } from "next/navigation";

import { WaveDetail } from "@/features/waves/wave-detail";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getWaveDetailById } from "@/lib/services/posts-service";
import { getReactionCatalog } from "@/lib/services/reaction-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type WaveDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WaveDetailPage({ params }: WaveDetailPageProps) {
  const { id } = await params;
  const viewer = await getViewerContext();
  const approvedViewer = await enforceApprovedViewerPageAccess({ viewer, nextPath: `/wave/${id}` });
  const post = await getWaveDetailById(id, approvedViewer.userId);

  if (!post) {
    notFound();
  }

  return (
    <WaveDetail
      post={post}
      isAuthenticated
      reactionCatalog={getReactionCatalog()}
    />
  );
}
