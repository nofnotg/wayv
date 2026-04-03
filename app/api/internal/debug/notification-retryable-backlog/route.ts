import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { getNotificationRetryableBacklogSnapshot } from "@/lib/services/notification-delivery-observability-service";

export async function GET(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const snapshot = await getNotificationRetryableBacklogSnapshot({
    limit: Number.isFinite(limit) ? limit : 100
  });

  return NextResponse.json(snapshot);
}
