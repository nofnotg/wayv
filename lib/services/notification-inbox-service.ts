import { revalidatePath } from "next/cache";

import type {
  NotificationEvent,
  NotificationEventState,
  NotificationInboxSummary
} from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  inboxVisibleNotificationStates,
  unreadNotificationStates,
  resolveNotificationEventState,
  summarizeUnreadNotificationLanes
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

export async function listNotificationInboxEvents(userId: string, limit = 50) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("user_id", userId)
    .in("state", inboxVisibleNotificationStates)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 100)));

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapEventRow(row as EventRow));
}

export async function getNotificationInboxSummary(userId: string): Promise<NotificationInboxSummary> {
  const supabase = await createServerSupabaseClient();
  const countQuery = supabase
    .from("notification_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("state", unreadNotificationStates)
    .is("read_at", null);

  const unreadRowsQuery = supabase
    .from("notification_events")
    .select("lane, created_at, state, read_at")
    .eq("user_id", userId)
    .in("state", unreadNotificationStates)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const [{ count, error: countError }, { data: unreadRows, error: unreadError }] = await Promise.all([
    countQuery,
    unreadRowsQuery
  ]);

  if (countError) {
    throw new Error(countError.message);
  }

  if (unreadError) {
    throw new Error(unreadError.message);
  }

  const unreadEvents = (unreadRows ?? []).map((row) => ({
    lane: (row.lane as NotificationEvent["lane"]) ?? "quiet_digest",
    state: row.state as NotificationEvent["state"],
    readAt: (row.read_at as string | null) ?? null
  }));
  const unreadCount = Number(count ?? 0);
  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    latestUnreadAt: unreadRows?.[0]?.created_at ?? null,
    unreadByLane: summarizeUnreadNotificationLanes(unreadEvents)
  };
}

async function mutateNotificationEventState(eventId: string, userId: string, action: "read" | "dismiss") {
  const supabase = await createServerSupabaseClient();
  const { data: current, error: readError } = await supabase
    .from("notification_events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (readError || !current) {
    throw new Error("notification-not-found");
  }

  const nextState = resolveNotificationEventState(
    current.state as NotificationEventState,
    action
  );
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = {
    state: nextState
  };

  if (nextState === "read" || nextState === "dismissed") {
    patch.read_at = current.read_at ?? now;
  }

  const { data, error } = await supabase
    .from("notification_events")
    .update(patch)
    .eq("id", eventId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "notification-update-failed");
  }

  revalidatePath("/inbox");
  revalidatePath("/", "layout");
  return mapEventRow(data as EventRow);
}

export async function markNotificationEventRead(eventId: string, userId: string) {
  return mutateNotificationEventState(eventId, userId, "read");
}

export async function dismissNotificationEvent(eventId: string, userId: string) {
  return mutateNotificationEventState(eventId, userId, "dismiss");
}
