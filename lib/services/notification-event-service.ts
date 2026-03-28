import type {
  NotificationCandidate,
  NotificationEvent,
  NotificationEventDecision,
  NotificationEventState,
  NotificationEventWriteSummary,
  NotificationPreference,
  NotificationSuppressionReason,
  RestModeSetting
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

import {
  buildNotificationCandidateDraftsForUser,
  getNotificationCandidateContextForUser
} from "@/lib/services/notification-candidate-service";

const DUPLICATE_WINDOW_HOURS = 12;
const OPERATIONAL_DUPLICATE_WINDOW_HOURS = 2;

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
  suppression_reason: NotificationSuppressionReason | null;
  dedupe_key: string | null;
  created_at: string;
};

type StoredEventLookup = Pick<EventRow, "state" | "dedupe_key" | "created_at">;

function isOperationalCandidate(candidate: Pick<NotificationCandidate, "type" | "lane">) {
  return candidate.type === "operational_notice" || candidate.type === "safety_notice" || candidate.lane === "operational";
}

function buildDedupeKey(candidate: Pick<NotificationCandidate, "userId" | "type" | "postId" | "lane">) {
  return [candidate.userId, candidate.type, candidate.postId ?? "none", candidate.lane].join(":");
}

function parseMinutes(value: string | null) {
  if (!value) {
    return null;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

export function isWithinQuietHours(
  preference: NotificationPreference | null,
  now = new Date()
) {
  const start = parseMinutes(preference?.quietHoursStart ?? null);
  const end = parseMinutes(preference?.quietHoursEnd ?? null);

  if (start === null || end === null || start === end) {
    return false;
  }

  const current = now.getHours() * 60 + now.getMinutes();
  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

function getSuppressionReason(input: {
  candidate: NotificationCandidate;
  preference: NotificationPreference | null;
  restMode: RestModeSetting | null;
  now: Date;
}): NotificationSuppressionReason | null {
  const operational = isOperationalCandidate(input.candidate);
  const operationalAllowed = input.restMode?.allowOperationalNotifications !== false;

  if ((!input.preference?.enabled || input.preference.digestMode === "off") && !(operational && operationalAllowed)) {
    return "preferences_disabled";
  }

  if (input.restMode?.enabled && !(operational && operationalAllowed)) {
    return "rest_mode";
  }

  if (isWithinQuietHours(input.preference, input.now) && !(operational && operationalAllowed)) {
    return "quiet_hours";
  }

  if (operational && !operationalAllowed) {
    return "operational_disabled";
  }

  return null;
}

function getDecisionState(input: {
  candidate: NotificationCandidate;
  suppressionReason: NotificationSuppressionReason | null;
}): NotificationEventState {
  if (input.suppressionReason) {
    return "suppressed";
  }

  if (isOperationalCandidate(input.candidate)) {
    return "operational_only";
  }

  return "pending";
}

function isWithinDuplicateWindow(existing: StoredEventLookup, candidate: NotificationCandidate, now: Date) {
  if (!existing.dedupe_key) {
    return false;
  }

  const ageHours = (now.getTime() - new Date(existing.created_at).getTime()) / (1000 * 60 * 60);
  const maxHours = isOperationalCandidate(candidate)
    ? OPERATIONAL_DUPLICATE_WINDOW_HOURS
    : DUPLICATE_WINDOW_HOURS;

  return ageHours <= maxHours;
}

export function decideNotificationEvent(input: {
  candidate: NotificationCandidate;
  preference: NotificationPreference | null;
  restMode: RestModeSetting | null;
  recentEvents: StoredEventLookup[];
  now?: Date;
}): NotificationEventDecision {
  const now = input.now ?? new Date();
  const suppressionReason = getSuppressionReason({
    candidate: input.candidate,
    preference: input.preference,
    restMode: input.restMode,
    now
  });
  const dedupeKey = buildDedupeKey(input.candidate);
  const isDuplicate = input.recentEvents.some(
    (event) => event.dedupe_key === dedupeKey && isWithinDuplicateWindow(event, input.candidate, now)
  );

  return {
    userId: input.candidate.userId,
    type: input.candidate.type,
    channel: "inapp",
    lane: input.candidate.lane,
    postId: input.candidate.postId,
    title: input.candidate.title,
    body: input.candidate.body,
    state: isDuplicate ? "skipped_duplicate" : getDecisionState({ candidate: input.candidate, suppressionReason }),
    suppressionReason: isDuplicate ? "duplicate_window" : suppressionReason,
    dedupeKey
  };
}

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

async function fetchRecentEvents(userId: string, limit = 40): Promise<StoredEventLookup[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notification_events")
    .select("state, dedupe_key, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StoredEventLookup[];
}

export async function persistNotificationEventsForUser(userId: string) {
  const supabase = createAdminSupabaseClient();
  const [{ preference, restMode }, candidates, recentEvents] = await Promise.all([
    getNotificationCandidateContextForUser(userId),
    buildNotificationCandidateDraftsForUser(userId),
    fetchRecentEvents(userId)
  ]);

  const summary = {
    usersScanned: 1,
    eventsCreated: 0,
    duplicatesSkipped: 0,
    suppressedByRestMode: 0,
    suppressedByPreference: 0,
    suppressedByQuietHours: 0,
    operationalOnly: 0
  } satisfies NotificationEventWriteSummary;

  const createdEvents: NotificationEvent[] = [];
  const recentBuffer = [...recentEvents];

  for (const candidate of candidates) {
    const decision = decideNotificationEvent({
      candidate,
      preference,
      restMode,
      recentEvents: recentBuffer
    });

    const { data, error } = await supabase
      .from("notification_events")
      .insert({
        user_id: decision.userId,
        type: decision.type,
        channel: decision.channel,
        post_id: decision.postId,
        lane: decision.lane,
        title: decision.title,
        body: decision.body,
        state: decision.state,
        suppression_reason: decision.suppressionReason,
        dedupe_key: decision.dedupeKey
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "notification-event-failed");
    }

    recentBuffer.unshift({
      state: decision.state,
      dedupe_key: decision.dedupeKey,
      created_at: String(data.created_at)
    });

    if (decision.state === "pending") {
      summary.eventsCreated += 1;
    } else if (decision.state === "operational_only") {
      summary.eventsCreated += 1;
      summary.operationalOnly += 1;
    } else if (decision.state === "skipped_duplicate") {
      summary.duplicatesSkipped += 1;
    } else if (decision.suppressionReason === "rest_mode") {
      summary.suppressedByRestMode += 1;
    } else if (decision.suppressionReason === "preferences_disabled" || decision.suppressionReason === "operational_disabled") {
      summary.suppressedByPreference += 1;
    } else if (decision.suppressionReason === "quiet_hours") {
      summary.suppressedByQuietHours += 1;
    }

    createdEvents.push(mapEventRow(data as EventRow));
  }

  return { summary, events: createdEvents };
}

export async function listNotificationEvents(input?: { limit?: number; userId?: string }) {
  const supabase = createAdminSupabaseClient();
  const query = supabase
    .from("notification_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(input?.limit ?? 50, 100)));

  const filtered = input?.userId ? query.eq("user_id", input.userId) : query;
  const { data, error } = await filtered;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapEventRow(row as EventRow));
}

export async function getNotificationDebugSummaryForUser(userId: string) {
  const [context, candidates, events] = await Promise.all([
    getNotificationCandidateContextForUser(userId),
    buildNotificationCandidateDraftsForUser(userId),
    listNotificationEvents({ userId, limit: 20 })
  ]);

  return {
    userId,
    preference: context.preference,
    restMode: context.restMode,
    candidateCount: candidates.length,
    candidates: candidates.map((candidate) => ({
      type: candidate.type,
      lane: candidate.lane,
      postId: candidate.postId
    })),
    recentEvents: events
  };
}

export async function runNotificationDigestJob(limit = 20) {
  const supabase = createAdminSupabaseClient();
  const { data: rows, error } = await supabase
    .from("notification_preferences")
    .select("user_id")
    .limit(Math.max(1, Math.min(limit, 100)));

  if (error) {
    throw new Error(error.message);
  }

  const userIds = (rows ?? []).map((row) => String(row.user_id));
  const summary: NotificationEventWriteSummary = {
    usersScanned: userIds.length,
    eventsCreated: 0,
    duplicatesSkipped: 0,
    suppressedByRestMode: 0,
    suppressedByPreference: 0,
    suppressedByQuietHours: 0,
    operationalOnly: 0
  };

  const perUser = [];
  for (const userId of userIds) {
    const result = await persistNotificationEventsForUser(userId);
    summary.eventsCreated += result.summary.eventsCreated;
    summary.duplicatesSkipped += result.summary.duplicatesSkipped;
    summary.suppressedByRestMode += result.summary.suppressedByRestMode;
    summary.suppressedByPreference += result.summary.suppressedByPreference;
    summary.suppressedByQuietHours += result.summary.suppressedByQuietHours;
    summary.operationalOnly += result.summary.operationalOnly;

    perUser.push({
      userId,
      eventsCreated: result.summary.eventsCreated,
      duplicatesSkipped: result.summary.duplicatesSkipped,
      suppressedByRestMode: result.summary.suppressedByRestMode,
      suppressedByPreference: result.summary.suppressedByPreference,
      suppressedByQuietHours: result.summary.suppressedByQuietHours,
      operationalOnly: result.summary.operationalOnly
    });
  }

  return { summary, perUser };
}
