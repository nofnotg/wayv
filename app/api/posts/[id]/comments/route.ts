import { NextRequest, NextResponse } from "next/server";

import { createComment, listCommentsForPost } from "@/lib/services/comment-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type CommentRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: CommentRouteProps) {
  const { id } = await params;
  const viewer = await getViewerContext();
  const comments = await listCommentsForPost(id, viewer?.userId);

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest, { params }: CommentRouteProps) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const comments = await createComment(body, id, viewer.userId);
    return NextResponse.json({ comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-comment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
