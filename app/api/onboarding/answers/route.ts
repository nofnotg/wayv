import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { persistOnboardingAnswers } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";
import { onboardingSubmissionSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer, { requireOnboarding: false });
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const body = await request.json();
  const parsed = onboardingSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-onboarding" }, { status: 400 });
  }

  try {
    const seedProfile = await persistOnboardingAnswers(parsed.data.answers, approvedViewer.userId);
    return NextResponse.json({ ok: true, seedProfile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-onboarding";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
