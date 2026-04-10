import { NextRequest, NextResponse } from "next/server";

import {
  listBetaAccessRequests,
  listRecentBetaAccessAuditLogs
} from "@/lib/services/beta-access-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { betaAccessListQuerySchema } from "@/lib/validation/schemas";

function getNullable(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  return value?.trim() ? value.trim() : null;
}

export async function GET(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = betaAccessListQuerySchema.safeParse({
    status: getNullable(url.searchParams, "status"),
    limit: Number(url.searchParams.get("limit") ?? "20")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-query" }, { status: 400 });
  }

  const [requests, audits] = await Promise.all([
    listBetaAccessRequests(parsed.data),
    listRecentBetaAccessAuditLogs(parsed.data.limit)
  ]);

  return NextResponse.json({
    requests,
    audits,
    filters: parsed.data
  });
}
