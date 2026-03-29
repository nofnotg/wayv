import { NextRequest, NextResponse } from "next/server";

import {
  markNotificationBatchFailed,
  markNotificationBatchRetryable,
  markNotificationBatchSent
} from "@/lib/services/notification-delivery-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { notificationDeliveryOutcomeSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = notificationDeliveryOutcomeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result =
    parsed.data.outcome === "sent"
      ? await markNotificationBatchSent(parsed.data)
      : parsed.data.outcome === "failed"
        ? await markNotificationBatchFailed(parsed.data)
        : await markNotificationBatchRetryable(parsed.data);

  return NextResponse.json({
    ok: true,
    events: result
  });
}
