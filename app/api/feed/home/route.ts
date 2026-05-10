import { NextResponse } from "next/server";

import { buildHomeFeed } from "@/lib/services/feed-service";
import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { getStoredSeedProfile } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const seedProfile = await getStoredSeedProfile(approvedViewer.userId);
  const feed = await buildHomeFeed({
    viewerId: approvedViewer.userId,
    seedProfile,
    restMode: approvedViewer.restMode
  });

  return NextResponse.json(feed);
}
