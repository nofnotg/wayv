import { NextResponse } from "next/server";

import { buildNotificationCandidatesForUser } from "@/lib/services/notification-candidate-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const candidates = await buildNotificationCandidatesForUser(viewer.userId);
  return NextResponse.json({ candidates });
}
