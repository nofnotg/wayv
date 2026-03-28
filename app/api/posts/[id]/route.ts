import { NextResponse } from "next/server";

import { getWaveDetailById } from "@/lib/services/posts-service";
import { getReactionCatalog } from "@/lib/services/reaction-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type PostRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: PostRouteProps) {
  const { id } = await params;
  const viewer = await getViewerContext();
  const post = await getWaveDetailById(id, viewer?.userId);

  if (!post) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return NextResponse.json({
    post,
    reactions: {
      catalog: getReactionCatalog()
    }
  });
}
