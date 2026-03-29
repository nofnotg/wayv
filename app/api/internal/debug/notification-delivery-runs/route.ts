import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { listNotificationDeliveryRuns } from "@/lib/services/notification-delivery-run-history-service";

export async function GET(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "10");
  const runs = await listNotificationDeliveryRuns(limit);

  return NextResponse.json({
    runs
  });
}
