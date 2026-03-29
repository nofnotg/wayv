import { NextResponse } from "next/server";

import {
  getNotificationInboxSummary,
  listNotificationInboxEvents
} from "@/lib/services/notification-inbox-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [events, summary] = await Promise.all([
    listNotificationInboxEvents(viewer.userId),
    getNotificationInboxSummary(viewer.userId)
  ]);
  return NextResponse.json({ events, summary });
}
