import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listModerationReports = vi.fn();
const listModerationAuditLogs = vi.fn();
const updatePostModerationStatus = vi.fn();
const updateCommentModerationStatus = vi.fn();

vi.mock("@/lib/services/moderation-admin-service", () => ({
  listModerationReports,
  listModerationAuditLogs,
  updatePostModerationStatus,
  updateCommentModerationStatus
}));

describe("internal moderation routes", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = previousSecret;
  });

  it("protects the moderation report list route", async () => {
    listModerationReports.mockResolvedValue([]);
    const { GET } = await import("../../app/api/internal/moderation/reports/route");

    const unauthorized = await GET(
      new Request("http://localhost/api/internal/moderation/reports") as never
    );
    expect(unauthorized.status).toBe(403);

    const authorized = await GET(
      new Request("http://localhost/api/internal/moderation/reports?limit=10", {
        headers: {
          "x-cron-secret": "test-secret"
        }
      }) as never
    );

    expect(listModerationReports).toHaveBeenCalledWith(10);
    expect(authorized.status).toBe(200);
  });

  it("protects the moderation audit debug route", async () => {
    listModerationAuditLogs.mockResolvedValue([]);
    const { GET } = await import("../../app/api/internal/debug/moderation-audits/route");

    const unauthorized = await GET(
      new Request("http://localhost/api/internal/debug/moderation-audits") as never
    );
    expect(unauthorized.status).toBe(403);

    const authorized = await GET(
      new Request("http://localhost/api/internal/debug/moderation-audits?limit=5&targetType=post&nextStatus=removed&actorLabel=operator-console", {
        headers: {
          "x-cron-secret": "test-secret"
        }
      }) as never
    );

    expect(listModerationAuditLogs).toHaveBeenCalledWith(5, {
      targetType: "post",
      nextStatus: "removed",
      actorLabel: "operator-console"
    });
    expect(authorized.status).toBe(200);
  });

  it("updates post moderation state only for authorized internal requests", async () => {
    updatePostModerationStatus.mockResolvedValue({ id: "post-1", status: "limited" });
    const { PATCH } = await import("../../app/api/internal/moderation/posts/[id]/route");

    const unauthorized = await PATCH(
      new Request("http://localhost/api/internal/moderation/posts/post-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "limited" })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(unauthorized.status).toBe(403);

    const authorized = await PATCH(
      new Request("http://localhost/api/internal/moderation/posts/post-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "test-secret",
          "x-operator-label": "operator-console"
        },
        body: JSON.stringify({ status: "limited" })
      }) as never,
      { params: Promise.resolve({ id: "post-1" }) }
    );

    expect(updatePostModerationStatus).toHaveBeenCalledWith(
      "post-1",
      "limited",
      "operator-console"
    );
    expect(authorized.status).toBe(200);
  });

  it("rejects invalid moderation updates for comments", async () => {
    const { PATCH } = await import("../../app/api/internal/moderation/comments/[id]/route");

    const response = await PATCH(
      new Request("http://localhost/api/internal/moderation/comments/comment-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "test-secret"
        },
        body: JSON.stringify({ status: "unknown_state" })
      }) as never,
      { params: Promise.resolve({ id: "comment-1" }) }
    );

    expect(updateCommentModerationStatus).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});
