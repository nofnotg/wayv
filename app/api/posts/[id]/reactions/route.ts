import { NextRequest, NextResponse } from "next/server";

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
  const state = await getReactionState(id, viewer?.userId);

  return NextResponse.json({
    summary: state.summary,
    viewerReactionTypes: state.viewerReactionTypes,
    catalog: getReactionCatalog()
  });
}

export async function POST(request: NextRequest, { params }: ReactionRouteProps) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const state = await addReaction(body, id, viewer.userId);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-reaction";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: ReactionRouteProps) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const state = await removeReaction(body, id, viewer.userId);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-reaction";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
