import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { claimDeliverableNotificationBatch } from "@/lib/services/notification-delivery-service";
import { notificationDeliveryClaimSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = notificationDeliveryClaimSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const batch = await claimDeliverableNotificationBatch(parsed.data);
  return NextResponse.json({
    ok: true,
    batch
  });
}
