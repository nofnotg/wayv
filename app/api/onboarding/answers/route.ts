import { NextRequest, NextResponse } from "next/server";

import { persistOnboardingAnswers } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";
import { onboardingSubmissionSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-onboarding" }, { status: 400 });
  }

  const seedProfile = await persistOnboardingAnswers(parsed.data.answers, viewer.userId);
  return NextResponse.json({ ok: true, seedProfile });
}
