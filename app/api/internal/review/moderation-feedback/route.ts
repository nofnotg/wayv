import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { buildCsv } from "@/lib/services/internal-review-export-service";
import { listModerationFeedback } from "@/lib/services/moderation-feedback-service";
import { moderationFeedbackReviewQuerySchema } from "@/lib/validation/schemas";

function getNullable(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  return value?.trim() ? value.trim() : null;
}

function getNullableBoolean(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  if (value == null || value === "") {
    return null;
  }

  return value === "true";
}

export async function GET(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = moderationFeedbackReviewQuerySchema.safeParse({
    limit: Number(url.searchParams.get("limit") ?? "50"),
    dateFrom: getNullable(url.searchParams, "dateFrom"),
    dateTo: getNullable(url.searchParams, "dateTo"),
    action: getNullable(url.searchParams, "action"),
    targetType: getNullable(url.searchParams, "targetType"),
    reason: getNullable(url.searchParams, "reason"),
    userId: getNullable(url.searchParams, "userId"),
    hasFreeText: getNullableBoolean(url.searchParams, "hasFreeText"),
    format: url.searchParams.get("format") ?? "json"
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-query" }, { status: 400 });
  }

  const feedback = await listModerationFeedback(parsed.data);

  if (parsed.data.format === "csv") {
    const csv = buildCsv(feedback, [
      { key: "id", header: "id" },
      { key: "createdAt", header: "created_at" },
      { key: "userId", header: "user_id" },
      { key: "targetType", header: "target_type" },
      { key: "targetId", header: "target_id" },
      { key: "action", header: "action" },
      { key: "reasons", header: "reasons" },
      { key: "guidanceFamily", header: "guidance_family" },
      { key: "choice", header: "choice" },
      { key: "freeText", header: "free_text" },
      { key: "path", header: "path" },
      { key: "retryAttempted", header: "retry_attempted" },
      { key: "retrySucceeded", header: "retry_succeeded" }
    ]);

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="moderation-feedback-review.csv"'
      }
    });
  }

  return NextResponse.json({
    feedback,
    filters: parsed.data
  });
}
