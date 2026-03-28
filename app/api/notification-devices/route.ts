import { NextRequest, NextResponse } from "next/server";

import {
  getNotificationDevices,
  upsertNotificationDevice
} from "@/lib/services/notification-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const devices = await getNotificationDevices(viewer.userId);
  return NextResponse.json({ devices });
}

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    await upsertNotificationDevice(body, viewer.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-device";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
