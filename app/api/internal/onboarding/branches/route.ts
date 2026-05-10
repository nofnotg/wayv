import { NextRequest, NextResponse } from "next/server";

import { upsertOnboardingBranch } from "@/lib/services/onboarding-admin-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";

export async function POST(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);

  try {
    const branch = await upsertOnboardingBranch({
      branch: payload,
      actorUserId: internal.viewerUserId ?? null,
      actorLabel: internal.actorLabel
    });
    return NextResponse.json({ branch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "onboarding-branch-upsert-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
