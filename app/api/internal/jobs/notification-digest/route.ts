import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { runNotificationDigestJob } from "@/lib/services/notification-event-service";

export async function POST(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
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
