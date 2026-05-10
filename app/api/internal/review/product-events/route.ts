import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { buildCsv } from "@/lib/services/internal-review-export-service";
import { listProductEvents } from "@/lib/services/product-event-service";
import { productEventReviewQuerySchema } from "@/lib/validation/schemas";

function getNullable(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  return value?.trim() ? value.trim() : null;
}

function parseBoolean(value: string | null) {
  if (value == null || value === "") {
    return null;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}

export async function GET(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = productEventReviewQuerySchema.safeParse({
    limit: Number(url.searchParams.get("limit") ?? "50"),
    dateFrom: getNullable(url.searchParams, "dateFrom"),
    dateTo: getNullable(url.searchParams, "dateTo"),
    eventKey: getNullable(url.searchParams, "eventKey"),
    isSeed: parseBoolean(url.searchParams.get("isSeed")),
    format: url.searchParams.get("format") ?? "json"
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-query" }, { status: 400 });
  }

  const events = await listProductEvents(parsed.data);

  if (parsed.data.format === "csv") {
    const csv = buildCsv(events, [
      { key: "id", header: "id" },
      { key: "createdAt", header: "created_at" },
      { key: "eventKey", header: "event_key" },
      { key: "targetType", header: "target_type" },
      { key: "targetId", header: "target_id" },
      { key: "isSeed", header: "is_seed" },
      { key: "userId", header: "user_id" },
      { key: "metadata", header: "metadata" }
    ]);

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="product-events-review.csv"'
      }
    });
  }

  return NextResponse.json({
    events,
    filters: parsed.data
  });
}
