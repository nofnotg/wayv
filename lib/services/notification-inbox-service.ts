import { revalidatePath } from "next/cache";

import type {
  NotificationEvent,
  NotificationEventState
} from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type InboxAction = "read" | "dismiss";
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
};

const visibleInboxStates: NotificationEventState[] = [
  "pending",
  "operational_only",
  "sent",
  "read",
  "dismissed"
];

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
    createdAt: String(row.created_at)
  };
}

export function resolveNotificationEventState(
  currentState: NotificationEventState,
  action: InboxAction
): NotificationEventState {
  if (action === "read") {
    if (currentState === "dismissed") {
      return "dismissed";
    }

    if (currentState === "read") {
      return "read";
    }

    if (currentState === "pending" || currentState === "operational_only" || currentState === "sent") {
      return "read";
    }
  }

  if (action === "dismiss") {
    if (currentState === "dismissed") {
      return "dismissed";
    }

    if (currentState === "pending" || currentState === "operational_only" || currentState === "sent" || currentState === "read") {
      return "dismissed";
    }
  }

  return currentState;
}

export async function listNotificationInboxEvents(userId: string, limit = 50) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("user_id", userId)
    .in("state", visibleInboxStates)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 100)));

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapEventRow(row as EventRow));
}

async function mutateNotificationEventState(eventId: string, userId: string, action: InboxAction) {
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
  return mapEventRow(data as EventRow);
}

export async function markNotificationEventRead(eventId: string, userId: string) {
  return mutateNotificationEventState(eventId, userId, "read");
}

export async function dismissNotificationEvent(eventId: string, userId: string) {
  return mutateNotificationEventState(eventId, userId, "dismiss");
}
