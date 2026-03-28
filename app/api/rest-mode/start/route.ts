import { NextRequest, NextResponse } from "next/server";

import { updateRestModeSetting } from "@/lib/services/profile-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const result = await updateRestModeSetting(
      {
        enabled: true,
        hours: body.hours,
        duration: body.duration
      },
      viewer.userId
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-rest-mode";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
