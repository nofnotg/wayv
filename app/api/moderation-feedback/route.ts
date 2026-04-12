import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { submitModerationFeedback } from "@/lib/services/moderation-feedback-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "invalid-moderation-feedback" }, { status: 400 });
  }

  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }

  try {
    const feedback = await submitModerationFeedback(payload as never, viewer!.userId);
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "moderation-feedback-submit-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
