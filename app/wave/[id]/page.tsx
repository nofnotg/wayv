import { notFound } from "next/navigation";

import { WaveDetail } from "@/features/waves/wave-detail";
import { getWavePostById } from "@/lib/services/posts-service";

type WaveDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WaveDetailPage({ params }: WaveDetailPageProps) {
  const { id } = await params;
  const post = await getWavePostById(id);

  if (!post) {
    notFound();
  }

  return <WaveDetail post={post} />;
}
