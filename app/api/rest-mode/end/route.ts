import { NextResponse } from "next/server";

import { updateRestModeSetting } from "@/lib/services/profile-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function POST() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await updateRestModeSetting({ enabled: false }, viewer.userId);
  return NextResponse.json(result);
}
