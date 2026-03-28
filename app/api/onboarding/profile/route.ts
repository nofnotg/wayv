import { NextResponse } from "next/server";

import { getStoredSeedProfile } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getStoredSeedProfile(viewer.userId);
  return NextResponse.json({ seedProfile: profile });
}
