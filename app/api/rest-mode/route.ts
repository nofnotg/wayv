import { NextRequest, NextResponse } from "next/server";

import { updateRestModeSetting } from "@/lib/services/profile-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ restMode: viewer.restMode });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const result = await updateRestModeSetting(body, viewer.userId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-rest-mode";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
