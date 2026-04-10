import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { submitBetaFeedback } from "@/lib/services/beta-feedback-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "invalid-feedback" }, { status: 400 });
  }

  try {
    const viewer = await getViewerContext();
    const guard = buildApprovedViewerApiGuard(viewer);
    if (guard) {
      return guard;
    }
    const approvedViewer = viewer!;
    const feedback = await submitBetaFeedback(
      payload as {
        category: "bug" | "confusing" | "suggestion" | "emotional_discomfort" | "exit_reason";
        message: string;
        pagePath?: string | null;
        contactEmail?: string | null;
      },
      approvedViewer.userId
    );

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "feedback-submit-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
