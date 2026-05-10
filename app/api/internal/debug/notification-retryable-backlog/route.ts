import { NextRequest, NextResponse } from "next/server";

import type { NotificationChannel, NotificationProviderRetryCategory } from "@/lib/domain/types";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { getNotificationRetryableBacklogSnapshot } from "@/lib/services/notification-delivery-observability-service";

export async function GET(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const channel = url.searchParams.get("channel") as NotificationChannel | null;
  const provider = url.searchParams.get("provider");
  const retryCategory = url.searchParams.get("retryCategory") as NotificationProviderRetryCategory | null;
  const timing = url.searchParams.get("timing") as "due_now" | "waiting" | null;
  const snapshot = await getNotificationRetryableBacklogSnapshot({
    limit: Number.isFinite(limit) ? limit : 100,
    filters: {
      channel,
      provider,
      retryCategory,
      timing
    }
  });

  return NextResponse.json(snapshot);
}

