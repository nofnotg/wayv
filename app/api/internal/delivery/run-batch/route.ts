import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { runNotificationDeliveryBatch } from "@/lib/services/notification-delivery-runner-service";
import { notificationDeliveryRunSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = notificationDeliveryRunSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await runNotificationDeliveryBatch(parsed.data);
  return NextResponse.json({
    ok: true,
    batch: result.batch,
    results: result.results,
    summary: result.summary,
    run: result.run
  });
}
