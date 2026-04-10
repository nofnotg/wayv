import { NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { getQuestionFlow } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }

  return NextResponse.json({
    questions: getQuestionFlow([])
  });
}
