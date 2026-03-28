import { NextResponse } from "next/server";

import { buildHomeFeed } from "@/lib/services/feed-service";
import { getStoredSeedProfile } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const seedProfile = await getStoredSeedProfile(viewer.userId);
  const feed = await buildHomeFeed({
    seedProfile,
    restMode: viewer.restMode
  });

  return NextResponse.json(feed);
}
