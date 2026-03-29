import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { listModerationAuditLogs } from "@/lib/services/moderation-admin-service";
import type { ModerationStatus } from "@/lib/domain/types";

export async function GET(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const targetTypeParam = url.searchParams.get("targetType");
  const nextStatusParam = url.searchParams.get("nextStatus");
  const actorLabel = url.searchParams.get("actorLabel") ?? undefined;
  const targetType =
    targetTypeParam === "post" || targetTypeParam === "comment" ? targetTypeParam : undefined;
  const nextStatus = (
    ["active", "under_review", "limited", "removed"].includes(nextStatusParam ?? "")
      ? nextStatusParam
      : undefined
  ) as ModerationStatus | undefined;
  const audits = await listModerationAuditLogs(limit, {
    targetType,
    nextStatus,
    actorLabel
  });
  return NextResponse.json({ audits });
}
