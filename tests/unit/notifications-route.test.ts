import { afterEach, describe, expect, it, vi } from "vitest";

const getViewerContext = vi.fn();
const listNotificationInboxEvents = vi.fn();
const markNotificationEventRead = vi.fn();
const dismissNotificationEvent = vi.fn();

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

vi.mock("@/lib/services/notification-inbox-service", () => ({
  listNotificationInboxEvents,
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

  it("lists recent inbox events for signed-in users", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    listNotificationInboxEvents.mockResolvedValue([{ id: "event-1" }]);
    const { GET } = await import("../../app/api/notifications/route");

    const response = await GET();
    expect(listNotificationInboxEvents).toHaveBeenCalledWith("viewer-1");
    await expect(response.json()).resolves.toEqual({ events: [{ id: "event-1" }] });
  });

  it("marks an event as read for the signed-in user", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    markNotificationEventRead.mockResolvedValue({ id: "event-1", state: "read" });
    const { POST } = await import("../../app/api/notifications/[id]/read/route");

    const response = await POST(
      new Request("http://localhost/api/notifications/event-1/read", {
        method: "POST"
      }) as never,
      { params: Promise.resolve({ id: "event-1" }) }
    );

    expect(markNotificationEventRead).toHaveBeenCalledWith("event-1", "viewer-1");
    expect(response.status).toBe(200);
  });

  it("dismisses an event for the signed-in user", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    dismissNotificationEvent.mockResolvedValue({ id: "event-1", state: "dismissed" });
    const { POST } = await import("../../app/api/notifications/[id]/dismiss/route");

    const response = await POST(
      new Request("http://localhost/api/notifications/event-1/dismiss", {
        method: "POST"
      }) as never,
      { params: Promise.resolve({ id: "event-1" }) }
    );

    expect(dismissNotificationEvent).toHaveBeenCalledWith("event-1", "viewer-1");
    expect(response.status).toBe(200);
  });
});
