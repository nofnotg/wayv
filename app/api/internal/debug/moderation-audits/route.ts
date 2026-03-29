import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { listModerationAuditLogs } from "@/lib/services/moderation-admin-service";

export async function GET(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50");
  const audits = await listModerationAuditLogs(limit);
  return NextResponse.json({ audits });
}
