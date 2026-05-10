import { NextRequest, NextResponse } from "next/server";

import {
  listOnboardingSourceBundles,
  upsertOnboardingSource
} from "@/lib/services/onboarding-admin-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";

export async function GET(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sources = await listOnboardingSourceBundles({ includeInactive: true });
  return NextResponse.json({ sources });
}

export async function POST(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);

  try {
    const source = await upsertOnboardingSource({
      source: payload,
      actorUserId: internal.viewerUserId ?? null,
      actorLabel: internal.actorLabel
    });
    return NextResponse.json({ source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "onboarding-source-upsert-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
