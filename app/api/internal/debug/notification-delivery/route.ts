import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { listDeliverableNotificationEvents } from "@/lib/services/notification-delivery-service";

export async function GET(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const userId = url.searchParams.get("userId") ?? undefined;
  const channelParam = url.searchParams.get("channel");
  const channel =
    channelParam === "inapp" || channelParam === "email" || channelParam === "push"
      ? channelParam
      : undefined;

  const events = await listDeliverableNotificationEvents({ limit, userId, channel });
  return NextResponse.json({
    events,
    summary: {
      deliverableCount: events.length
    }
  });
}
