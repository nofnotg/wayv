import { afterEach, describe, expect, it, vi } from "vitest";

const getInternalRequestContext = vi.fn();
const listBetaFeedback = vi.fn();
const listProductEvents = vi.fn();
const listContentGuardrailFlags = vi.fn();

vi.mock("@/lib/services/internal-auth-service", () => ({
  getInternalRequestContext
}));

vi.mock("@/lib/services/beta-feedback-service", () => ({
  listBetaFeedback
}));

vi.mock("@/lib/services/product-event-service", () => ({
  listProductEvents
}));

vi.mock("@/lib/services/content-guardrail-service", () => ({
  listContentGuardrailFlags
}));

describe("internal review export routes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("blocks beta feedback review when unauthorized", async () => {
    getInternalRequestContext.mockResolvedValue({ authorized: false, actorLabel: "guest" });
    const { GET } = await import("../../app/api/internal/review/beta-feedback/route");

    const response = await GET(
      new Request("http://localhost/api/internal/review/beta-feedback") as never
    );

    expect(response.status).toBe(403);
  });

  it("returns filtered beta feedback review data", async () => {
    getInternalRequestContext.mockResolvedValue({ authorized: true, actorLabel: "operator" });
    listBetaFeedback.mockResolvedValue([{ id: "feedback-1", category: "bug" }]);
    const { GET } = await import("../../app/api/internal/review/beta-feedback/route");

    const response = await GET(
      new Request(
        "http://localhost/api/internal/review/beta-feedback?limit=10&category=bug&dateFrom=2025-01-01&format=json"
      ) as never
    );

    expect(listBetaFeedback).toHaveBeenCalledWith({
      limit: 10,
      dateFrom: "2025-01-01",
      dateTo: null,
      category: "bug",
      pagePath: null,
      format: "json"
    });
    expect(response.status).toBe(200);
  });

  it("exports product events as csv", async () => {
    getInternalRequestContext.mockResolvedValue({ authorized: true, actorLabel: "operator" });
    listProductEvents.mockResolvedValue([
      {
        id: "event-1",
        createdAt: "2025-01-01T00:00:00.000Z",
        eventKey: "feedback_submitted",
        targetType: "feedback",
        targetId: "feedback-1",
        isSeed: false,
        userId: "user-1",
        metadata: { pagePath: "/feedback" }
      }
    ]);
    const { GET } = await import("../../app/api/internal/review/product-events/route");

    const response = await GET(
      new Request(
        "http://localhost/api/internal/review/product-events?limit=5&eventKey=feedback_submitted&isSeed=false&format=csv"
      ) as never
    );

    expect(listProductEvents).toHaveBeenCalledWith({
      limit: 5,
      dateFrom: null,
      dateTo: null,
      eventKey: "feedback_submitted",
      isSeed: false,
      format: "csv"
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    await expect(response.text()).resolves.toContain("feedback_submitted");
  });

  it("returns guardrail review data with filters", async () => {
    getInternalRequestContext.mockResolvedValue({ authorized: true, actorLabel: "operator" });
    listContentGuardrailFlags.mockResolvedValue([
      {
        id: "flag-1",
        targetType: "feedback_message",
        targetId: "feedback-1",
        userId: "user-1",
        action: "hard_block",
        severity: "high",
        suggestedAction: "hard_block",
        guidanceFamily: "privacy_exposure",
        reasons: ["privacy_exposure"],
        matchedTerms: ["phone-pattern"],
        contentExcerpt: "010-1234-5678",
        originalText: "010-1234-5678",
        createdAt: "2025-01-01T00:00:00.000Z"
      }
    ]);
    const { GET } = await import("../../app/api/internal/review/content-guardrails/route");

    const response = await GET(
      new Request(
        "http://localhost/api/internal/review/content-guardrails?limit=20&action=hard_block&targetType=feedback_message&reason=privacy_exposure"
      ) as never
    );

    expect(listContentGuardrailFlags).toHaveBeenCalledWith({
      limit: 20,
      dateFrom: null,
      dateTo: null,
      action: "hard_block",
      targetType: "feedback_message",
      reason: "privacy_exposure",
      format: "json"
    });
    expect(response.status).toBe(200);
  });
});
