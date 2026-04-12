import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { createComment, listCommentsForPost } from "@/lib/services/comment-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type CommentRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: CommentRouteProps) {
  const { id } = await params;
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;
  const comments = await listCommentsForPost(id, approvedViewer.userId);

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest, { params }: CommentRouteProps) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const { id } = await params;
  const body = await request.json();

  try {
    const result = await createComment(body, id, approvedViewer.userId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-comment";
    try {
      const parsed = JSON.parse(message) as { error?: string; moderation?: unknown };
      if (parsed.error) {
        return NextResponse.json(parsed, { status: 400 });
      }
    } catch {
      // ignore malformed non-JSON errors
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
