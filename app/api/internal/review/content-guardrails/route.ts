import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { buildCsv } from "@/lib/services/internal-review-export-service";
import { listContentGuardrailFlags } from "@/lib/services/content-guardrail-service";
import { contentGuardrailReviewQuerySchema } from "@/lib/validation/schemas";

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
  const parsed = contentGuardrailReviewQuerySchema.safeParse({
    limit: Number(url.searchParams.get("limit") ?? "50"),
    dateFrom: getNullable(url.searchParams, "dateFrom"),
    dateTo: getNullable(url.searchParams, "dateTo"),
    action: getNullable(url.searchParams, "action"),
    targetType: getNullable(url.searchParams, "targetType"),
    reason: getNullable(url.searchParams, "reason"),
    format: url.searchParams.get("format") ?? "json"
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-query" }, { status: 400 });
  }

  const flags = await listContentGuardrailFlags(parsed.data);

  if (parsed.data.format === "csv") {
    const csv = buildCsv(flags, [
      { key: "id", header: "id" },
      { key: "createdAt", header: "created_at" },
      { key: "targetType", header: "target_type" },
      { key: "targetId", header: "target_id" },
      { key: "userId", header: "user_id" },
      { key: "action", header: "action" },
      { key: "severity", header: "severity" },
      { key: "suggestedAction", header: "suggested_action" },
      { key: "guidanceFamily", header: "guidance_family" },
      { key: "reasons", header: "reasons" },
      { key: "matchedTerms", header: "matched_terms" },
      { key: "contentExcerpt", header: "content_excerpt" },
      { key: "originalText", header: "original_text" }
    ]);

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="content-guardrails-review.csv"'
      }
    });
  }

  return NextResponse.json({
    flags,
    filters: parsed.data
  });
}
