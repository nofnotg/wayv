import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type EventState =
  | "pending"
  | "operational_only"
  | "retryable"
  | "failed"
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
  claim_token: string | null;
  claimed_at: string | null;
  claim_expires_at: string | null;
  next_retry_at: string | null;
  last_attempt_at: string | null;
  last_error: string | null;
  attempt_count: number;
  sent_at: string | null;
  read_at: string | null;
};

const state = {
  notification_events: [] as EventRow[]
};

function resetState() {
  state.notification_events = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "viewer-1",
      type: "for_you_wave",
      channel: "inapp",
      post_id: "post-1",
      lane: "for_you",
      title: "도달한 파도",
      body: "조용히 이어 볼 만한 이야기가 있어요.",
      state: "pending",
      suppression_reason: null,
      dedupe_key: "k1",
      created_at: "2026-03-29T08:00:00.000Z",
      claim_token: null,
      claimed_at: null,
      claim_expires_at: null,
      next_retry_at: null,
      last_attempt_at: null,
      last_error: null,
      attempt_count: 0,
      sent_at: null,
      read_at: null
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      user_id: "viewer-1",
      type: "operational_notice",
      channel: "inapp",
      post_id: null,
      lane: "operational",
      title: "운영 안내",
      body: "확인이 필요한 흐름이 있어요.",
      state: "operational_only",
      suppression_reason: null,
      dedupe_key: "k2",
      created_at: "2026-03-29T09:00:00.000Z",
      claim_token: null,
      claimed_at: null,
      claim_expires_at: null,
      next_retry_at: null,
      last_attempt_at: null,
      last_error: null,
      attempt_count: 0,
      sent_at: null,
      read_at: null
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      user_id: "viewer-1",
      type: "for_you_wave",
      channel: "inapp",
      post_id: "post-2",
      lane: "for_you",
      title: "조금 뒤 다시 볼 파도",
      body: "나중에 다시 이어 볼게요.",
      state: "retryable",
      suppression_reason: null,
      dedupe_key: "k3",
      created_at: "2026-03-29T07:00:00.000Z",
      claim_token: null,
      claimed_at: null,
      claim_expires_at: null,
      next_retry_at: "2026-03-29T06:00:00.000Z",
      last_attempt_at: "2026-03-29T05:00:00.000Z",
      last_error: "temporary-outage",
      attempt_count: 1,
      sent_at: null,
      read_at: null
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      user_id: "viewer-1",
      type: "for_you_wave",
      channel: "inapp",
      post_id: "post-3",
      lane: "for_you",
      title: "나중에 다시 시도할 파도",
      body: "아직은 기다리고 있어요.",
      state: "retryable",
      suppression_reason: null,
      dedupe_key: "k4",
      created_at: "2026-03-29T06:00:00.000Z",
      claim_token: null,
      claimed_at: null,
      claim_expires_at: null,
      next_retry_at: "2999-01-01T00:00:00.000Z",
      last_attempt_at: "2026-03-29T04:00:00.000Z",
      last_error: "quiet-window",
      attempt_count: 2,
      sent_at: null,
      read_at: null
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      user_id: "viewer-1",
      type: "for_you_wave",
      channel: "inapp",
      post_id: "post-4",
      lane: "for_you",
      title: "이미 읽은 파도",
      body: "다시 열어볼 필요는 없어요.",
      state: "read",
      suppression_reason: null,
      dedupe_key: "k5",
      created_at: "2026-03-29T05:00:00.000Z",
      claim_token: null,
      claimed_at: null,
      claim_expires_at: null,
      next_retry_at: null,
      last_attempt_at: "2026-03-29T05:05:00.000Z",
      last_error: null,
      attempt_count: 1,
      sent_at: "2026-03-29T05:01:00.000Z",
      read_at: "2026-03-29T05:02:00.000Z"
    }
  ];
}

type Filters = {
  ids: string[] | null;
  userId: string | null;
  channel: string | null;
  states: string[] | null;
  readAtNull: boolean;
};

function isClaimAvailable(event: EventRow, nowIso: string) {
  return !event.claim_token || (event.claim_expires_at !== null && event.claim_expires_at < nowIso);
}

function createQuery() {
  const filters: Filters = {
    ids: null,
    userId: null,
    channel: null,
    states: null,
    readAtNull: false
  };

  let action: "select" | "update" = "select";
  let updatePayload: Record<string, unknown> | null = null;
  let limitCount = Number.POSITIVE_INFINITY;
  let orFilter: string | null = null;
  let orderAscending = false;

  const applyFilters = () =>
    state.notification_events
      .filter((event) => {
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
        if (orFilter) {
          const nowIso = orFilter.split("claim_expires_at.lt.")[1] ?? "";
          if (!isClaimAvailable(event, nowIso)) {
            return false;
          }
        }
        return true;
      })
      .sort((left, right) => {
        if (!orderAscending) {
          return 0;
        }

        return left.created_at.localeCompare(right.created_at);
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
      return this;
    },
    eq(column: string, value: string) {
      if (column === "user_id") {
        filters.userId = value;
      }
      if (column === "channel") {
        filters.channel = value;
      }
      if (column === "id") {
        filters.ids = [value];
      }
      return this;
    },
    is(column: string, value: null) {
      if (column === "read_at" && value === null) {
        filters.readAtNull = true;
      }
      return this;
    },
    or(value: string) {
      orFilter = value;
      return this;
    },
    order(_column?: string, options?: { ascending?: boolean }) {
      orderAscending = options?.ascending ?? false;
      return this;
    },
    limit(limit: number) {
      limitCount = limit;
      return this;
    },
    single() {
      const rows = applyFilters();
      if (action === "update" && updatePayload && rows.length) {
        const row = rows[0];
        Object.assign(row, updatePayload);
        return Promise.resolve({ data: row, error: null });
      }
      return Promise.resolve({ data: rows[0] ?? null, error: null });
    },
    then(resolve: (value: { data: EventRow[]; error: null }) => void) {
      if (action === "update" && updatePayload) {
        const rows = applyFilters();
        for (const row of rows) {
          Object.assign(row, updatePayload);
        }
        resolve({ data: rows.slice(0, limitCount), error: null });
        return;
      }

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

    expect(events.map((event) => event.id)).toEqual([
      "33333333-3333-4333-8333-333333333333",
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222"
    ]);
  });

  it("claims a batch once and prevents an immediate duplicate claim", async () => {
    const { claimDeliverableNotificationBatch } = await import(
      "../../lib/services/notification-delivery-service"
    );

    const first = await claimDeliverableNotificationBatch({ limit: 2, userId: "viewer-1" });
    expect(first.events.length).toBeGreaterThan(0);

    const second = await claimDeliverableNotificationBatch({ limit: 2, userId: "viewer-1" });
    expect(
      second.events.every((event) => !first.events.some((claimed) => claimed.id === event.id))
    ).toBe(true);
  });

  it("marks only claimed events as sent", async () => {
    const { markNotificationBatchSent } = await import(
      "../../lib/services/notification-delivery-service"
    );
    const updated = await markNotificationBatchSent({
      eventIds: ["11111111-1111-4111-8111-111111111111"]
    });

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      state: "sent"
    });
    expect(updated[0].sentAt).toBeTruthy();
  });

  it("marks claimed events as failed or retryable with attempt metadata", async () => {
    const { markNotificationBatchFailed, markNotificationBatchRetryable } = await import(
      "../../lib/services/notification-delivery-service"
    );

    const failed = await markNotificationBatchFailed({
      eventIds: ["33333333-3333-4333-8333-333333333333"],
      lastError: "provider-timeout"
    });

    expect(failed[0]).toMatchObject({
      state: "failed",
      lastError: "provider-timeout",
      attemptCount: 2
    });

    const retryable = await markNotificationBatchRetryable({
      eventIds: ["11111111-1111-4111-8111-111111111111"],
      retryAfterMinutes: 30,
      lastError: "push-window-closed"
    });

    expect(retryable[0]).toMatchObject({
      state: "retryable",
      lastError: "push-window-closed"
    });
    expect(retryable[0].nextRetryAt).toBeTruthy();
  });
});
