import { NextResponse } from "next/server";

import { getNotificationInboxSummary } from "@/lib/services/notification-inbox-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await getNotificationInboxSummary(viewer.userId);
  return NextResponse.json({ summary });
}
