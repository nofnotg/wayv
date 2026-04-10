import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import {
  addReaction,
  getReactionCatalog,
  getReactionState,
  removeReaction
} from "@/lib/services/reaction-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type ReactionRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: ReactionRouteProps) {
  const { id } = await params;
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;
  const state = await getReactionState(id, approvedViewer.userId);

  return NextResponse.json({
    summary: state.summary,
    viewerReactionTypes: state.viewerReactionTypes,
    catalog: getReactionCatalog()
  });
}

export async function POST(request: NextRequest, { params }: ReactionRouteProps) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const { id } = await params;
  const body = await request.json();

  try {
    const state = await addReaction(body, id, approvedViewer.userId);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-reaction";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: ReactionRouteProps) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const { id } = await params;
  const body = await request.json();

  try {
    const state = await removeReaction(body, id, approvedViewer.userId);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-reaction";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
