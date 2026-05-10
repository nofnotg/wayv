import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import {
  releaseExpiredNotificationClaims,
  requeueNotificationDeliveryEvents
} from "@/lib/services/notification-delivery-service";
import { notificationDeliveryControlSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = notificationDeliveryControlSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result =
    parsed.data.action === "requeue"
      ? await requeueNotificationDeliveryEvents(parsed.data)
      : await releaseExpiredNotificationClaims(parsed.data);

  return NextResponse.json({
    ok: true,
    result
  });
}

