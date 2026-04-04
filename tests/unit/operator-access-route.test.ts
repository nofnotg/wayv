import { afterEach, describe, expect, it, vi } from "vitest";

const getInternalRequestContext = vi.fn();
const isInternalRequestAuthorized = vi.fn();
const upsertOperatorAccess = vi.fn();

vi.mock("@/lib/services/internal-auth-service", () => ({
  getInternalRequestContext,
  isInternalRequestAuthorized
}));

vi.mock("@/lib/services/operator-access-service", () => ({
  upsertOperatorAccess
}));

describe("operator access route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires internal secret access even if operator context exists", async () => {
    getInternalRequestContext.mockResolvedValue({ authorized: true, actorLabel: "operator" });
    isInternalRequestAuthorized.mockReturnValue(false);
    const { POST } = await import("../../app/api/internal/operator/access/route");

    const response = await POST(
      new Request("http://localhost/api/internal/operator/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "11111111-1111-1111-1111-111111111111",
          role: "operator"
        })
      }) as never
    );

    expect(response.status).toBe(403);
  });

  it("upserts operator access for valid internal requests", async () => {
    getInternalRequestContext.mockResolvedValue({ authorized: true, actorLabel: "internal-token" });
    isInternalRequestAuthorized.mockReturnValue(true);
    upsertOperatorAccess.mockResolvedValue({
      userId: "11111111-1111-1111-1111-111111111111",
      role: "admin",
      isActive: true
    });
    const { POST } = await import("../../app/api/internal/operator/access/route");

    const response = await POST(
      new Request("http://localhost/api/internal/operator/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "11111111-1111-1111-1111-111111111111",
          role: "admin",
          isActive: true
        })
      }) as never
    );

    expect(upsertOperatorAccess).toHaveBeenCalledWith({
      userId: "11111111-1111-1111-1111-111111111111",
      role: "admin",
      isActive: true
    });
    expect(response.status).toBe(201);
  });
});
