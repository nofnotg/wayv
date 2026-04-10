import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import {
  getNotificationInboxSummary,
  markNotificationEventRead
} from "@/lib/services/notification-inbox-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_: NextRequest, { params }: RouteProps) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const { id } = await params;

  try {
    const event = await markNotificationEventRead(id, approvedViewer.userId);
    const summary = await getNotificationInboxSummary(approvedViewer.userId);
    return NextResponse.json({ event, summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "notification-update-failed" },
      { status: 400 }
    );
  }
}
