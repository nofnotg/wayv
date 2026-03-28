import { NextRequest, NextResponse } from "next/server";

import { buildNotificationDigestPreview } from "@/lib/services/notification-candidate-service";
import { getCronSecret } from "@/lib/supabase/env";

function isAuthorized(request: NextRequest) {
  const secret = getCronSecret();
  return secret ? request.headers.get("x-cron-secret") === secret : false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const preview = await buildNotificationDigestPreview();
  return NextResponse.json({
    ok: true,
    status: "ready-for-delivery-layer",
    userCount: preview.length,
    preview
  });
}
