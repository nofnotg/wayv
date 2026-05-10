import { NextRequest, NextResponse } from "next/server";

import type { NotificationDeliveryScope } from "@/lib/domain/types";
import { notificationEventStateValues } from "@/lib/domain/types";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import {
  buildNotificationDeliveryAnalytics,
  filterNotificationDeliveryEventsByScope
} from "@/lib/services/notification-delivery-analytics-service";
import {
  listDeliverableNotificationEvents,
  listNotificationDeliveryEvents
} from "@/lib/services/notification-delivery-service";

const deliveryScopes: NotificationDeliveryScope[] = [
  "ready",
  "claimed",
  "expired_claims",
  "retryable_backlog",
  "sent",
  "failed"
];

export async function GET(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
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
  const scopeParam = url.searchParams.get("scope");
  const scope = deliveryScopes.includes(scopeParam as NotificationDeliveryScope)
    ? (scopeParam as NotificationDeliveryScope)
    : undefined;

  const sourceEvents = states.length
    ? await listNotificationDeliveryEvents({ limit, userId, channel, states })
    : scope
      ? await listNotificationDeliveryEvents({
          limit,
          userId,
          channel,
          states: ["pending", "operational_only", "retryable", "sent", "failed"]
        })
      : await listDeliverableNotificationEvents({ limit, userId, channel });

  const events = scope
    ? filterNotificationDeliveryEventsByScope(sourceEvents, scope)
    : sourceEvents;
  const stateSummary = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.state] = (acc[event.state] ?? 0) + 1;
    return acc;
  }, {});
  const analytics = buildNotificationDeliveryAnalytics(sourceEvents);

  return NextResponse.json({
    events,
    summary: {
      deliverableCount: events.filter(
        (event) => event.state === "pending" || event.state === "operational_only" || event.state === "retryable"
      ).length,
      stateSummary,
      analytics
    }
  });
}

