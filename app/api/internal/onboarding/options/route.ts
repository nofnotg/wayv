import { NextRequest, NextResponse } from "next/server";

import { upsertOnboardingOption } from "@/lib/services/onboarding-admin-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";

export async function POST(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);

  try {
    const option = await upsertOnboardingOption({
      option: payload,
      actorUserId: internal.viewerUserId ?? null,
      actorLabel: internal.actorLabel
    });
    return NextResponse.json({ option });
  } catch (error) {
    const message = error instanceof Error ? error.message : "onboarding-option-upsert-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
