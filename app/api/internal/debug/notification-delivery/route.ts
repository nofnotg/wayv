import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import {
  listDeliverableNotificationEvents,
  listNotificationDeliveryEvents
} from "@/lib/services/notification-delivery-service";
import { notificationEventStateValues } from "@/lib/domain/types";

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
  const states = url.searchParams
    .getAll("state")
    .filter((value): value is (typeof notificationEventStateValues)[number] =>
      notificationEventStateValues.includes(value as (typeof notificationEventStateValues)[number])
    );

  const events = states.length
    ? await listNotificationDeliveryEvents({ limit, userId, channel, states })
    : await listDeliverableNotificationEvents({ limit, userId, channel });

  const stateSummary = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.state] = (acc[event.state] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    events,
    summary: {
      deliverableCount: events.filter(
        (event) => event.state === "pending" || event.state === "operational_only" || event.state === "retryable"
      ).length,
      stateSummary
    }
  });
}
