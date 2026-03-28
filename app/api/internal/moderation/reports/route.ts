import { NextRequest, NextResponse } from "next/server";

import { isInternalRequestAuthorized } from "@/lib/services/internal-auth-service";
import { listModerationReports } from "@/lib/services/moderation-admin-service";

export async function GET(request: NextRequest) {
  if (!isInternalRequestAuthorized(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50");
  const reports = await listModerationReports(limit);
  return NextResponse.json({ reports });
}
