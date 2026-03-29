import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const refreshWaveSnapshot = vi.fn();

type ModerationStatus = "active" | "under_review" | "limited" | "removed";

type FakeState = {
  wave_posts: Record<string, { id: string; moderation_status: ModerationStatus }>;
  wave_comments: Record<string, { id: string; post_id: string; moderation_status: ModerationStatus }>;
  moderation_audit_logs: Array<{
    id: string;
    target_type: "post" | "comment";
    target_id: string;
    previous_status: ModerationStatus;
    next_status: ModerationStatus;
    actor_label: string;
    created_at: string;
  }>;
};

const state: FakeState = {
  wave_posts: {},
  wave_comments: {},
  moderation_audit_logs: []
};

function resetState() {
  state.wave_posts = {
    "post-1": { id: "post-1", moderation_status: "active" }
  };
  state.wave_comments = {
    "comment-1": {
      id: "comment-1",
      post_id: "post-1",
      moderation_status: "under_review"
    }
  };
  state.moderation_audit_logs = [];
}

function createQuery(table: keyof FakeState) {
  const context: {
    action: "select" | "update" | "insert";
    payload: Record<string, unknown> | null;
    filters: Record<string, string>;
  } = {
    action: "select",
    payload: null,
    filters: {}
  };

  return {
    select() {
      return this;
    },
    update(payload: Record<string, unknown>) {
      context.action = "update";
      context.payload = payload;
      return this;
    },
    insert(payload: Record<string, unknown>) {
      context.action = "insert";
      context.payload = payload;
      return this;
    },
    eq(column: string, value: string) {
      context.filters[column] = value;

      if (context.action === "update") {
        if (table === "wave_posts") {
          state.wave_posts[value] = {
            ...state.wave_posts[value],
            moderation_status: context.payload?.moderation_status as ModerationStatus
          };
        }

        if (table === "wave_comments") {
          state.wave_comments[value] = {
            ...state.wave_comments[value],
            moderation_status: context.payload?.moderation_status as ModerationStatus
          };
        }

        return { error: null };
      }

      return this;
    },
    order() {
      return this;
    },
    limit(limit: number) {
      if (table === "moderation_audit_logs") {
        return {
          data: state.moderation_audit_logs.slice(0, limit),
          error: null
        };
      }

      return {
        data: [],
        error: null
      };
    },
    single() {
      if (context.action === "select") {
        const id = context.filters.id;
        if (table === "wave_posts") {
          return { data: state.wave_posts[id] ?? null, error: null };
        }

        if (table === "wave_comments") {
          return { data: state.wave_comments[id] ?? null, error: null };
        }
      }

      if (context.action === "insert" && table === "moderation_audit_logs") {
        const row = {
          id: `audit-${state.moderation_audit_logs.length + 1}`,
          target_type: context.payload?.target_type as "post" | "comment",
          target_id: String(context.payload?.target_id),
          previous_status: context.payload?.previous_status as ModerationStatus,
          next_status: context.payload?.next_status as ModerationStatus,
          actor_label: String(context.payload?.actor_label),
          created_at: "2026-03-29T10:00:00.000Z"
        };
        state.moderation_audit_logs.unshift(row);
        return { data: row, error: null };
      }

      return { data: null, error: null };
    }
  };
}

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("@/lib/services/wave-state-service", () => ({
  refreshWaveSnapshot
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminSupabaseClient: () => ({
    from(table: keyof FakeState) {
      return createQuery(table);
    }
  })
}));

describe("moderation admin service", () => {
  beforeEach(() => {
    resetState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes an audit record when a post moderation status changes", async () => {
    const { listModerationAuditLogs, updatePostModerationStatus } = await import(
      "../../lib/services/moderation-admin-service"
    );

    const result = await updatePostModerationStatus("post-1", "limited", "operator-console");
    const audits = await listModerationAuditLogs(10);

    expect(result.previousStatus).toBe("active");
    expect(result.status).toBe("limited");
    expect(audits[0]).toMatchObject({
      targetType: "post",
      targetId: "post-1",
      previousStatus: "active",
      nextStatus: "limited",
      actorLabel: "operator-console"
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/wave/post-1");
  });

  it("skips audit writes when the moderation status does not change", async () => {
    const { listModerationAuditLogs, updatePostModerationStatus } = await import(
      "../../lib/services/moderation-admin-service"
    );

    const result = await updatePostModerationStatus("post-1", "active", "operator-console");
    const audits = await listModerationAuditLogs(10);

    expect(result.previousStatus).toBe("active");
    expect(audits).toHaveLength(0);
  });

  it("writes comment moderation audits and refreshes the parent wave snapshot", async () => {
    const { listModerationAuditLogs, updateCommentModerationStatus } = await import(
      "../../lib/services/moderation-admin-service"
    );

    const result = await updateCommentModerationStatus(
      "comment-1",
      "removed",
      "operator-console"
    );
    const audits = await listModerationAuditLogs(10);

    expect(result.previousStatus).toBe("under_review");
    expect(result.status).toBe("removed");
    expect(audits[0]).toMatchObject({
      targetType: "comment",
      targetId: "comment-1",
      previousStatus: "under_review",
      nextStatus: "removed",
      actorLabel: "operator-console"
    });
    expect(refreshWaveSnapshot).toHaveBeenCalledWith("post-1");
  });
});
