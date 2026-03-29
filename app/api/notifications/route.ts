import { NextResponse } from "next/server";

import { listNotificationInboxEvents } from "@/lib/services/notification-inbox-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const events = await listNotificationInboxEvents(viewer.userId);
  return NextResponse.json({ events });
}
