import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { getNotificationDebugSummaryForUser } from "@/lib/services/notification-event-service";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteProps) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const summary = await getNotificationDebugSummaryForUser(id);
  return NextResponse.json(summary);
}
