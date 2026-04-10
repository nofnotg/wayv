import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { createWavePostEntry } from "@/lib/services/posts-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const body = await request.json();

  try {
    const result = await createWavePostEntry(body, approvedViewer.userId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
