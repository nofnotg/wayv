type NotificationDeliveryRunCursorDirection = "next" | "previous";

export type NotificationDeliveryRunCursor = {
  createdAt: string;
  id: string;
  offset: number;
  direction: NotificationDeliveryRunCursorDirection;
};

type NotificationDeliveryRunPageMetaInput = {
  attempts: Array<{ id: string; createdAt: string }>;
  offset: number;
  limit: number;
  total: number;
};

export function encodeNotificationDeliveryRunCursor(
  cursor: NotificationDeliveryRunCursor
) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeNotificationDeliveryRunCursor(cursor: string | null | undefined) {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as Partial<NotificationDeliveryRunCursor>;

    if (
      !parsed ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.id !== "string" ||
      typeof parsed.offset !== "number" ||
      !Number.isFinite(parsed.offset) ||
      (parsed.direction !== "next" && parsed.direction !== "previous")
    ) {
      return null;
    }

    return parsed as NotificationDeliveryRunCursor;
  } catch {
    return null;
  }
}

export function buildNotificationDeliveryRunPageMeta(
  input: NotificationDeliveryRunPageMetaInput
) {
  const { attempts, offset, limit, total } = input;
  const firstAttempt = attempts[0];
  const lastAttempt = attempts[attempts.length - 1];
  const hasMore = offset + attempts.length < total;

  return {
    offset,
    limit,
    total,
    hasMore,
    cursorType: "offset" as const,
    nextCursor:
      lastAttempt && hasMore
        ? encodeNotificationDeliveryRunCursor({
            createdAt: lastAttempt.createdAt,
            id: lastAttempt.id,
            offset: offset + attempts.length,
            direction: "next"
          })
        : null,
    previousCursor:
      firstAttempt && offset > 0
        ? encodeNotificationDeliveryRunCursor({
            createdAt: firstAttempt.createdAt,
            id: firstAttempt.id,
            offset: Math.max(offset - limit, 0),
            direction: "previous"
          })
        : null
  };
}
