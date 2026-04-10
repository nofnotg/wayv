import { NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { updateRestModeSetting } from "@/lib/services/profile-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function POST() {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const result = await updateRestModeSetting({ enabled: false }, approvedViewer.userId);
  return NextResponse.json(result);
}
