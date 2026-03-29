import type {
  NotificationChannel,
  NotificationEvent,
  NotificationEventState
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

import {
  deliverableNotificationStates,
  isNotificationEventDeliverable,
  resolveNotificationEventState
} from "@/lib/services/notification-lifecycle-service";

type EventRow = {
  id: string;
  user_id: string;
  type: NotificationEvent["type"];
  channel: NotificationEvent["channel"];
  post_id: string | null;
  lane: NotificationEvent["lane"];
  title: string;
  body: string;
  state: NotificationEventState;
  suppression_reason: NotificationEvent["suppressionReason"];
  dedupe_key: string | null;
  created_at: string;
  sent_at: string | null;
  read_at: string | null;
};

function mapEventRow(row: EventRow): NotificationEvent {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: row.type,
    channel: row.channel,
    postId: row.post_id,
    lane: row.lane,
    title: row.title,
    body: row.body,
    state: row.state,
    suppressionReason: row.suppression_reason,
    dedupeKey: row.dedupe_key,
    createdAt: String(row.created_at),
    sentAt: row.sent_at,
    readAt: row.read_at
  };
}

export async function listDeliverableNotificationEvents(input?: {
  limit?: number;
  userId?: string;
  channel?: NotificationChannel;
}) {
  const supabase = createAdminSupabaseClient();
  const safeLimit = Math.max(1, Math.min(input?.limit ?? 50, 200));

  let query = supabase
    .from("notification_events")
    .select("*")
    .in("state", deliverableNotificationStates)
    .is("read_at", null)
    .order("created_at", { ascending: true })
    .limit(safeLimit);

  if (input?.userId) {
    query = query.eq("user_id", input.userId);
  }

  if (input?.channel) {
    query = query.eq("channel", input.channel);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => mapEventRow(row as EventRow))
    .filter((event) => isNotificationEventDeliverable(event));
}

export async function markNotificationEventsSent(eventIds: string[]) {
  const uniqueIds = [...new Set(eventIds.filter(Boolean))];
  if (!uniqueIds.length) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data: current, error: currentError } = await supabase
    .from("notification_events")
    .select("*")
    .in("id", uniqueIds);

  if (currentError) {
    throw new Error(currentError.message);
  }

  const eligible = (current ?? [])
    .map((row) => row as EventRow)
    .filter((row) =>
      isNotificationEventDeliverable({
        state: row.state,
        readAt: row.read_at
      })
    );

  if (!eligible.length) {
    return [];
  }

  const now = new Date().toISOString();
  const eligibleIds = eligible.map((row) => row.id);

  const { data, error } = await supabase
    .from("notification_events")
    .update({
      state: resolveNotificationEventState("pending", "mark_sent"),
      sent_at: now
    })
    .in("id", eligibleIds)
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapEventRow(row as EventRow));
}
