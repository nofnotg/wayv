import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();

  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: viewer.userId,
      email: viewer.email
    },
    betaAccess: viewer.betaAccess,
    profile: viewer.profile,
    notificationPreferences: viewer.notificationPreferences,
    restMode: viewer.restMode
  });
}
