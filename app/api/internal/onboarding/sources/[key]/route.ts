import { NextRequest, NextResponse } from "next/server";

import { upsertOnboardingSource } from "@/lib/services/onboarding-admin-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";

type OnboardingSourceRouteProps = {
  params: Promise<{ key: string }>;
};

export async function PATCH(request: NextRequest, { params }: OnboardingSourceRouteProps) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const { key } = await params;

  try {
    const source = await upsertOnboardingSource({
      source: { ...(payload ?? {}), key },
      actorUserId: internal.viewerUserId ?? null,
      actorLabel: internal.actorLabel
    });
    return NextResponse.json({ source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "onboarding-source-update-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
