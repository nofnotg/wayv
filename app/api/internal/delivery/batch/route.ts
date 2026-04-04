import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { claimDeliverableNotificationBatch } from "@/lib/services/notification-delivery-service";
import { prepareNotificationDeliveryBatchForSender } from "@/lib/services/notification-sender-adapter";
import { notificationDeliveryClaimSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
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
  const senderBatch = prepareNotificationDeliveryBatchForSender(batch);
  return NextResponse.json({
    ok: true,
    batch,
    senderBatch
  });
}

