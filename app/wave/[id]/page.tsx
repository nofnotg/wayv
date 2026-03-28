import { notFound } from "next/navigation";

import { WaveDetail } from "@/features/waves/wave-detail";
import { getWaveDetailById } from "@/lib/services/posts-service";
import { getReactionCatalog } from "@/lib/services/reaction-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type WaveDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WaveDetailPage({ params }: WaveDetailPageProps) {
  const { id } = await params;
  const viewer = await getViewerContext();
  const post = await getWaveDetailById(id, viewer?.userId);

  if (!post) {
    notFound();
  }

  return (
    <WaveDetail
      post={post}
      isAuthenticated={Boolean(viewer)}
      reactionCatalog={getReactionCatalog()}
    />
  );
}
