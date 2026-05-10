import { afterEach, describe, expect, it, vi } from "vitest";

const getInternalRequestContext = vi.fn();
const listBetaAccessRequests = vi.fn();
const listRecentBetaAccessAuditLogs = vi.fn();
const updateBetaAccessRequestStatus = vi.fn();

vi.mock("@/lib/services/internal-auth-service", () => ({
  getInternalRequestContext
}));

vi.mock("@/lib/services/beta-access-service", () => ({
  listBetaAccessRequests,
  listRecentBetaAccessAuditLogs,
  updateBetaAccessRequestStatus
}));

describe("beta access internal review routes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists beta access requests for authorized operators", async () => {
    getInternalRequestContext.mockResolvedValue({
      authorized: true,
      actorLabel: "operator-console",
      viewerUserId: "operator-1"
    });
    listBetaAccessRequests.mockResolvedValue([{ id: "request-1", status: "pending" }]);
    listRecentBetaAccessAuditLogs.mockResolvedValue([{ id: "audit-1" }]);
    const { GET } = await import("../../app/api/internal/beta-access/requests/route");

    const response = await GET(
      new Request("http://localhost/api/internal/beta-access/requests?status=pending&limit=5") as never
    );

    expect(listBetaAccessRequests).toHaveBeenCalledWith({ status: "pending", limit: 5 });
    expect(listRecentBetaAccessAuditLogs).toHaveBeenCalledWith(5);
    expect(response.status).toBe(200);
  });

  it("blocks beta access review when unauthorized", async () => {
    getInternalRequestContext.mockResolvedValue({
      authorized: false,
      actorLabel: "guest",
      viewerUserId: null
    });
    const { GET } = await import("../../app/api/internal/beta-access/requests/route");

    const response = await GET(
      new Request("http://localhost/api/internal/beta-access/requests") as never
    );

    expect(response.status).toBe(403);
  });

  it("updates request status through the decision route", async () => {
    getInternalRequestContext.mockResolvedValue({
      authorized: true,
      actorLabel: "operator-console",
      viewerUserId: "operator-1"
    });
    updateBetaAccessRequestStatus.mockResolvedValue({
      id: "request-1",
      status: "approved",
      reviewNote: null
    });
    const { PATCH } = await import("../../app/api/internal/beta-access/requests/[id]/route");

    const response = await PATCH(
      new Request("http://localhost/api/internal/beta-access/requests/request-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" })
      }) as never,
      { params: Promise.resolve({ id: "request-1" }) }
    );

    expect(updateBetaAccessRequestStatus).toHaveBeenCalledWith({
      requestId: "request-1",
      status: "approved",
      note: null,
      actorUserId: "operator-1",
      actorLabel: "operator-console"
    });
    expect(response.status).toBe(200);
  });
});
