import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { getNotificationDeliveryRunDetail } from "@/lib/services/notification-delivery-attempt-log-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const detail = await getNotificationDeliveryRunDetail(id);

  if (!detail) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
