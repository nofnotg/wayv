import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { updateRestModeSetting } from "@/lib/services/profile-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const body = await request.json().catch(() => ({}));

  try {
    const result = await updateRestModeSetting(
      {
        enabled: true,
        hours: body.hours,
        duration: body.duration
      },
      approvedViewer.userId
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-rest-mode";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
