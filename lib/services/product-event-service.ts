import type { ProductEventKey, ProductEventLog } from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type ProductEventRow = Record<string, unknown>;

function mapProductEventRow(row: ProductEventRow): ProductEventLog {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    eventKey: row.event_key as ProductEventKey,
    targetType: (row.target_type as string | null) ?? null,
    targetId: (row.target_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    isSeed: Boolean(row.is_seed),
    createdAt: String(row.created_at)
  };
}

export async function recordProductEvent(input: {
  userId?: string | null;
  eventKey: ProductEventKey;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  isSeed?: boolean;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("product_event_logs")
    .insert({
      user_id: input.userId ?? null,
      event_key: input.eventKey,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      metadata: input.metadata ?? {},
      is_seed: Boolean(input.isSeed)
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "product-event-write-failed");
  }

  return mapProductEventRow(data);
}

export async function recordProductEventSafe(input: {
  userId?: string | null;
  eventKey: ProductEventKey;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  isSeed?: boolean;
}) {
  try {
    await recordProductEvent(input);
  } catch {
    return;
  }
}

export async function listRecentProductEvents(limit = 30) {
  return listProductEvents({
    limit
  });
}

export async function listProductEvents(filters?: {
  limit?: number;
  dateFrom?: string | null;
  dateTo?: string | null;
  eventKey?: ProductEventKey | null;
  isSeed?: boolean | null;
}) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("product_event_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(filters?.limit ?? 30, 200)));

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  if (filters?.eventKey) {
    query = query.eq("event_key", filters.eventKey);
  }

  if (typeof filters?.isSeed === "boolean") {
    query = query.eq("is_seed", filters.isSeed);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapProductEventRow(row));
}

export function summarizeProductEvents(events: ProductEventLog[]) {
  const byEventKey = new Map<ProductEventKey, number>();

  for (const event of events) {
    byEventKey.set(event.eventKey, (byEventKey.get(event.eventKey) ?? 0) + 1);
  }

  return [...byEventKey.entries()]
    .map(([eventKey, count]) => ({ eventKey, count }))
    .sort((left, right) => right.count - left.count || left.eventKey.localeCompare(right.eventKey));
}
