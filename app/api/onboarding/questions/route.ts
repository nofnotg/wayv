import { NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { getActiveOnboardingQuestions } from "@/lib/config/onboarding-questions";
import { getQuestionCatalogForViewer } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer, { requireOnboarding: false });
  if (guard) {
    return guard;
  }

  const questions = await getQuestionCatalogForViewer(viewer!.userId);

  return NextResponse.json({
    questions: getActiveOnboardingQuestions([], questions)
  });
}
