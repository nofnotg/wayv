import { NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import {
  getNotificationInboxSummary,
  listNotificationInboxEvents
} from "@/lib/services/notification-inbox-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const [events, summary] = await Promise.all([
    listNotificationInboxEvents(approvedViewer.userId),
    getNotificationInboxSummary(approvedViewer.userId)
  ]);
  return NextResponse.json({ events, summary });
}
