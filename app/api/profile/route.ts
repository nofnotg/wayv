import { NextRequest, NextResponse } from "next/server";

import { updateProfileSettings } from "@/lib/services/profile-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ profile: viewer.profile });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    await updateProfileSettings(body, viewer.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
