import { describe, expect, it } from "vitest";

import {
  buildNotificationDeliveryRunPageMeta,
  decodeNotificationDeliveryRunCursor
} from "../../lib/services/notification-delivery-run-cursor-service";

describe("notification delivery run cursor service", () => {
  it("builds next and previous cursors from attempt boundaries", () => {
    const page = buildNotificationDeliveryRunPageMeta({
      attempts: [
        {
          id: "attempt-11",
          createdAt: "2026-03-31T10:11:00.000Z"
        },
        {
          id: "attempt-12",
          createdAt: "2026-03-31T10:12:00.000Z"
        }
      ],
      offset: 10,
      limit: 2,
      total: 20
    });

    expect(page.cursorType).toBe("offset");
    expect(page.hasMore).toBe(true);
    expect(decodeNotificationDeliveryRunCursor(page.previousCursor)).toMatchObject({
      id: "attempt-11",
      createdAt: "2026-03-31T10:11:00.000Z",
      offset: 8,
      direction: "previous"
    });
    expect(decodeNotificationDeliveryRunCursor(page.nextCursor)).toMatchObject({
      id: "attempt-12",
      createdAt: "2026-03-31T10:12:00.000Z",
      offset: 12,
      direction: "next"
    });
  });

  it("omits next cursor on the last page", () => {
    const page = buildNotificationDeliveryRunPageMeta({
      attempts: [
        {
          id: "attempt-19",
          createdAt: "2026-03-31T10:19:00.000Z"
        },
        {
          id: "attempt-20",
          createdAt: "2026-03-31T10:20:00.000Z"
        }
      ],
      offset: 18,
      limit: 2,
      total: 20
    });

    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
    expect(decodeNotificationDeliveryRunCursor(page.previousCursor)).toMatchObject({
      offset: 16,
      direction: "previous"
    });
  });
});
