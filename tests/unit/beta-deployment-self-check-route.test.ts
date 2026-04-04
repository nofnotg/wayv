import { afterEach, describe, expect, it, vi } from "vitest";

const getInternalRequestContext = vi.fn();
const getBetaDeploymentSelfCheck = vi.fn();

vi.mock("@/lib/services/internal-auth-service", () => ({
  getInternalRequestContext
}));

vi.mock("@/lib/services/beta-deployment-self-check-service", () => ({
  getBetaDeploymentSelfCheck
}));

describe("beta deployment self-check route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("blocks self-check access when unauthorized", async () => {
    getInternalRequestContext.mockResolvedValue({ authorized: false, actorLabel: "guest" });
    const { GET } = await import("../../app/api/internal/debug/beta-gate-self-check/route");

    const response = await GET(
      new Request("http://localhost/api/internal/debug/beta-gate-self-check") as never
    );

    expect(response.status).toBe(403);
  });

  it("returns the compact self-check object for internal requests", async () => {
    getInternalRequestContext.mockResolvedValue({ authorized: true, actorLabel: "operator" });
    getBetaDeploymentSelfCheck.mockResolvedValue({
      checkedAt: "2026-04-04T10:00:00.000Z",
      request: {
        origin: "https://wayv.app",
        host: "wayv.app"
      },
      envReadiness: {
        status: "ready",
        summary: "env-ok",
        checks: {},
        appOrigin: "https://wayv.app",
        authRedirectOrigin: "https://wayv.app"
      },
      authFlowReadiness: {
        status: "ready_with_caution",
        summary: "auth-caution",
        checks: {}
      },
      operatorBootstrapReadiness: {
        status: "ready",
        summary: "operator-ok",
        checks: {}
      },
      reviewExportReadiness: {
        status: "ready",
        summary: "review-ok",
        checks: {}
      },
      overallStatus: "ready_with_caution",
      notes: ["note-1"]
    });

    const { GET } = await import("../../app/api/internal/debug/beta-gate-self-check/route");

    const response = await GET(
      new Request("http://localhost/api/internal/debug/beta-gate-self-check") as never
    );

    expect(getBetaDeploymentSelfCheck).toHaveBeenCalledWith({
      requestUrl: "http://localhost/api/internal/debug/beta-gate-self-check"
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      selfCheck: {
        overallStatus: "ready_with_caution",
        notes: ["note-1"]
      }
    });
  });
});
