import { NextRequest, NextResponse } from "next/server";

import { listRecentBetaFeedback, summarizeBetaFeedback } from "@/lib/services/beta-feedback-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";

export async function GET(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const feedback = await listRecentBetaFeedback(Number.isFinite(limit) ? limit : 20);

  return NextResponse.json({
    feedback,
    summary: summarizeBetaFeedback(feedback)
  });
}
