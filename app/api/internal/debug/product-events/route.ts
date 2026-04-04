import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { listRecentProductEvents, summarizeProductEvents } from "@/lib/services/product-event-service";

export async function GET(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "30");
  const events = await listRecentProductEvents(Number.isFinite(limit) ? limit : 30);

  return NextResponse.json({
    events,
    summary: summarizeProductEvents(events)
  });
}
