import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { listNotificationEvents } from "@/lib/services/notification-event-service";

export async function GET(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const userId = url.searchParams.get("userId") ?? undefined;
  const events = await listNotificationEvents({ limit, userId });

  return NextResponse.json({ events });
}

