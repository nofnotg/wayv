import { NextRequest, NextResponse } from "next/server";

import { listBetaFeedback } from "@/lib/services/beta-feedback-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { buildCsv } from "@/lib/services/internal-review-export-service";
import { betaFeedbackReviewQuerySchema } from "@/lib/validation/schemas";

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
  const parsed = betaFeedbackReviewQuerySchema.safeParse({
    limit: Number(url.searchParams.get("limit") ?? "50"),
    dateFrom: getNullable(url.searchParams, "dateFrom"),
    dateTo: getNullable(url.searchParams, "dateTo"),
    category: getNullable(url.searchParams, "category"),
    pagePath: getNullable(url.searchParams, "pagePath"),
    format: url.searchParams.get("format") ?? "json"
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-query" }, { status: 400 });
  }

  const feedback = await listBetaFeedback(parsed.data);

  if (parsed.data.format === "csv") {
    const csv = buildCsv(feedback, [
      { key: "id", header: "id" },
      { key: "createdAt", header: "created_at" },
      { key: "category", header: "category" },
      { key: "pagePath", header: "page_path" },
      { key: "contactEmail", header: "contact_email" },
      { key: "userId", header: "user_id" },
      { key: "message", header: "message" }
    ]);

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="beta-feedback-review.csv"'
      }
    });
  }

  return NextResponse.json({
    feedback,
    filters: parsed.data
  });
}
