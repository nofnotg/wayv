import { afterEach, describe, expect, it, vi } from "vitest";

const getViewerContext = vi.fn();
const listNotificationInboxEvents = vi.fn();
const getNotificationInboxSummary = vi.fn();
const markNotificationEventRead = vi.fn();
const dismissNotificationEvent = vi.fn();

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

vi.mock("@/lib/services/notification-inbox-service", () => ({
  listNotificationInboxEvents,
  getNotificationInboxSummary,
  markNotificationEventRead,
  dismissNotificationEvent,
  resolveNotificationEventState: vi.fn()
}));

describe("notification routes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires auth to list inbox events", async () => {
    getViewerContext.mockResolvedValue(null);
    const { GET } = await import("../../app/api/notifications/route");

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("lists recent inbox events and summary for signed-in users", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    listNotificationInboxEvents.mockResolvedValue([{ id: "event-1" }]);
    getNotificationInboxSummary.mockResolvedValue({
      unreadCount: 2,
      hasUnread: true,
      latestUnreadAt: "2026-03-29T10:00:00.000Z"
    });
    const { GET } = await import("../../app/api/notifications/route");

    const response = await GET();
    expect(listNotificationInboxEvents).toHaveBeenCalledWith("viewer-1");
    expect(getNotificationInboxSummary).toHaveBeenCalledWith("viewer-1");
    await expect(response.json()).resolves.toEqual({
      events: [{ id: "event-1" }],
      summary: {
        unreadCount: 2,
        hasUnread: true,
        latestUnreadAt: "2026-03-29T10:00:00.000Z"
      }
    });
  });

  it("returns summary from the dedicated summary route", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    getNotificationInboxSummary.mockResolvedValue({
      unreadCount: 1,
      hasUnread: true,
      latestUnreadAt: null
    });
    const { GET } = await import("../../app/api/notifications/summary/route");

    const response = await GET();
    expect(getNotificationInboxSummary).toHaveBeenCalledWith("viewer-1");
    await expect(response.json()).resolves.toEqual({
      summary: {
        unreadCount: 1,
        hasUnread: true,
        latestUnreadAt: null
      }
    });
  });

  it("marks an event as read for the signed-in user", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    markNotificationEventRead.mockResolvedValue({ id: "event-1", state: "read" });
    getNotificationInboxSummary.mockResolvedValue({
      unreadCount: 0,
      hasUnread: false,
      latestUnreadAt: null
    });
    const { POST } = await import("../../app/api/notifications/[id]/read/route");

    const response = await POST(
      new Request("http://localhost/api/notifications/event-1/read", {
        method: "POST"
      }) as never,
      { params: Promise.resolve({ id: "event-1" }) }
    );

    expect(markNotificationEventRead).toHaveBeenCalledWith("event-1", "viewer-1");
    expect(getNotificationInboxSummary).toHaveBeenCalledWith("viewer-1");
    expect(response.status).toBe(200);
  });

  it("dismisses an event for the signed-in user", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "approved" } });
    dismissNotificationEvent.mockResolvedValue({ id: "event-1", state: "dismissed" });
    getNotificationInboxSummary.mockResolvedValue({
      unreadCount: 0,
      hasUnread: false,
      latestUnreadAt: null
    });
    const { POST } = await import("../../app/api/notifications/[id]/dismiss/route");

    const response = await POST(
      new Request("http://localhost/api/notifications/event-1/dismiss", {
        method: "POST"
      }) as never,
      { params: Promise.resolve({ id: "event-1" }) }
    );

    expect(dismissNotificationEvent).toHaveBeenCalledWith("event-1", "viewer-1");
    expect(getNotificationInboxSummary).toHaveBeenCalledWith("viewer-1");
    expect(response.status).toBe(200);
  });

  it("returns 403 for pending viewers on inbox routes", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1", betaAccess: { status: "pending" } });
    const { GET } = await import("../../app/api/notifications/route");

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "beta-access-denied",
      status: "pending",
      applicationRequired: false
    });
  });
});
