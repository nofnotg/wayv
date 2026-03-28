import { NextRequest, NextResponse } from "next/server";

import { isInternalRequestAuthorized } from "@/lib/services/internal-auth-service";
import { runNotificationDigestJob } from "@/lib/services/notification-event-service";

export async function POST(request: NextRequest) {
  if (!isInternalRequestAuthorized(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "20");
  const result = await runNotificationDigestJob(limit);
  return NextResponse.json({
    ok: true,
    status: "events-persisted",
    ...result
  });
}
