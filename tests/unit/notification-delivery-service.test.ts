import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type EventState =
  | "pending"
  | "operational_only"
  | "sent"
  | "read"
  | "dismissed"
  | "suppressed"
  | "skipped_duplicate";

type EventRow = {
  id: string;
  user_id: string;
  type: "for_you_wave" | "operational_notice";
  channel: "inapp";
  post_id: string | null;
  lane: "for_you" | "operational";
  title: string;
  body: string;
  state: EventState;
  suppression_reason: string | null;
  dedupe_key: string | null;
  created_at: string;
  sent_at: string | null;
  read_at: string | null;
};

const state = {
  notification_events: [] as EventRow[]
};

function resetState() {
  state.notification_events = [
    {
      id: "event-1",
      user_id: "viewer-1",
      type: "for_you_wave",
      channel: "inapp",
      post_id: "post-1",
      lane: "for_you",
      title: "지금 닿을 만한 파도",
      body: "조용히 살펴볼 수 있어요.",
      state: "pending",
      suppression_reason: null,
      dedupe_key: "k1",
      created_at: "2026-03-29T08:00:00.000Z",
      sent_at: null,
      read_at: null
    },
    {
      id: "event-2",
      user_id: "viewer-1",
      type: "operational_notice",
      channel: "inapp",
      post_id: null,
      lane: "operational",
      title: "필요한 안내",
      body: "운영상 확인이 필요해요.",
      state: "operational_only",
      suppression_reason: null,
      dedupe_key: "k2",
      created_at: "2026-03-29T09:00:00.000Z",
      sent_at: null,
      read_at: null
    },
    {
      id: "event-3",
      user_id: "viewer-1",
      type: "for_you_wave",
      channel: "inapp",
      post_id: "post-2",
      lane: "for_you",
      title: "이미 읽은 파도",
      body: "다시 읽었어요.",
      state: "read",
      suppression_reason: null,
      dedupe_key: "k3",
      created_at: "2026-03-29T07:00:00.000Z",
      sent_at: "2026-03-29T07:10:00.000Z",
      read_at: "2026-03-29T07:20:00.000Z"
    },
    {
      id: "event-4",
      user_id: "viewer-2",
      type: "for_you_wave",
      channel: "inapp",
      post_id: "post-4",
      lane: "for_you",
      title: "억제된 파도",
      body: "이번에는 닿지 않아요.",
      state: "suppressed",
      suppression_reason: "rest_mode",
      dedupe_key: "k4",
      created_at: "2026-03-29T06:00:00.000Z",
      sent_at: null,
      read_at: null
    }
  ];
}

function createQuery() {
  const filters = {
    ids: null as string[] | null,
    userId: null as string | null,
    channel: null as string | null,
    states: null as string[] | null,
    readAtNull: false
  };
  let action: "select" | "update" = "select";
  let updatePayload: Record<string, unknown> | null = null;
  let limitCount = Number.POSITIVE_INFINITY;

  const applyFilters = () =>
    state.notification_events.filter((event) => {
      if (filters.userId && event.user_id !== filters.userId) {
        return false;
      }
      if (filters.channel && event.channel !== filters.channel) {
        return false;
      }
      if (filters.states && !filters.states.includes(event.state)) {
        return false;
      }
      if (filters.readAtNull && event.read_at !== null) {
        return false;
      }
      if (filters.ids && !filters.ids.includes(event.id)) {
        return false;
      }
      return true;
    });

  return {
    select() {
      return this;
    },
    update(payload: Record<string, unknown>) {
      action = "update";
      updatePayload = payload;
      return this;
    },
    in(column: string, values: string[]) {
      if (column === "state") {
        filters.states = values;
      }
      if (column === "id") {
        filters.ids = values;
      }

      if (action === "update" && column === "id") {
        for (const event of state.notification_events) {
          if (!values.includes(event.id)) {
            continue;
          }

          event.state = updatePayload?.state as EventState;
          event.sent_at = (updatePayload?.sent_at as string | null) ?? event.sent_at;
        }

        return {
          select() {
            return { data: applyFilters(), error: null };
          }
        };
      }

      return this;
    },
    eq(column: string, value: string) {
      if (column === "user_id") {
        filters.userId = value;
      }
      if (column === "channel") {
        filters.channel = value;
      }
      return this;
    },
    is(column: string, value: null) {
      if (column === "read_at" && value === null) {
        filters.readAtNull = true;
      }
      return this;
    },
    order() {
      return this;
    },
    limit(limit: number) {
      limitCount = limit;
      return this;
    },
    then(resolve: (value: { data: EventRow[]; error: null }) => void) {
      resolve({
        data: applyFilters().slice(0, limitCount),
        error: null
      });
    }
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createAdminSupabaseClient: () => ({
    from(table: string) {
      if (table !== "notification_events") {
        throw new Error(`unexpected table ${table}`);
      }
      return createQuery();
    }
  })
}));

describe("notification delivery service", () => {
  beforeEach(() => {
    resetState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists only delivery-ready events", async () => {
    const { listDeliverableNotificationEvents } = await import(
      "../../lib/services/notification-delivery-service"
    );

    const events = await listDeliverableNotificationEvents({ limit: 10, userId: "viewer-1" });

    expect(events.map((event) => event.id)).toEqual(["event-1", "event-2"]);
  });

  it("marks only eligible events as sent", async () => {
    const { markNotificationEventsSent } = await import(
      "../../lib/services/notification-delivery-service"
    );

    const updated = await markNotificationEventsSent(["event-1", "event-3"]);

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      id: "event-1",
      state: "sent"
    });
    expect(state.notification_events.find((event) => event.id === "event-3")?.state).toBe("read");
  });
});
