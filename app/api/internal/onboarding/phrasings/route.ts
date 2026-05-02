import { NextRequest, NextResponse } from "next/server";

import { upsertOnboardingPhrasing } from "@/lib/services/onboarding-admin-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";

export async function POST(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);

  try {
    const phrasing = await upsertOnboardingPhrasing({
      phrasing: payload,
      actorUserId: internal.viewerUserId ?? null,
      actorLabel: internal.actorLabel
    });
    return NextResponse.json({ phrasing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "onboarding-phrasing-upsert-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
