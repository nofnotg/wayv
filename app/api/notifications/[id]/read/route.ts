import { NextRequest, NextResponse } from "next/server";

import { markNotificationEventRead } from "@/lib/services/notification-inbox-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_: NextRequest, { params }: RouteProps) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await markNotificationEventRead(id, viewer.userId);
    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "notification-update-failed" },
      { status: 400 }
    );
  }
}
