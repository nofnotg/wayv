import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { getNotificationDeliveryRunDetailPage } from "@/lib/services/notification-delivery-attempt-log-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "25");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const cursor = url.searchParams.get("cursor");
  const detail = await getNotificationDeliveryRunDetailPage(id, {
    limit: Number.isFinite(limit) ? limit : 25,
    offset: Number.isFinite(offset) ? offset : 0,
    cursor
  });

  if (!detail) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
