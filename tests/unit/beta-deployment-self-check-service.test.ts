import { afterEach, describe, expect, it, vi } from "vitest";

const listBetaFeedback = vi.fn();
const listProductEvents = vi.fn();
const listContentGuardrailFlags = vi.fn();
const getOperatorAccess = vi.fn();
const select = vi.fn();
const eqActive = vi.fn();

vi.mock("@/lib/services/beta-feedback-service", () => ({
  listBetaFeedback
}));

vi.mock("@/lib/services/product-event-service", () => ({
  listProductEvents
}));

vi.mock("@/lib/services/content-guardrail-service", () => ({
  listContentGuardrailFlags
}));

vi.mock("@/lib/services/operator-access-service", () => ({
  getOperatorAccess
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminSupabaseClient: () => ({
    from: () => ({
      select
    })
  })
}));

describe("beta deployment self-check service", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    vi.clearAllMocks();
    process.env = { ...envBackup };
  });

  it("reports a ready-with-caution state when env is mostly ready but no operator is seeded", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.NEXT_PUBLIC_APP_URL = "https://wayv.app";
    process.env.SUPABASE_REDIRECT_URL = "https://wayv.app/auth/callback";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.CRON_SECRET = "cron-secret";
    process.env.MOBILE_AUTH_REDIRECTS = "wayv://auth/callback";

    listBetaFeedback.mockResolvedValue([]);
    listProductEvents.mockResolvedValue([]);
    listContentGuardrailFlags.mockResolvedValue([]);
    getOperatorAccess.mockResolvedValue({ userId: "viewer-1", role: "operator" });
    eqActive.mockResolvedValue({ count: 0, error: null });
    select.mockReturnValue({ eq: eqActive });

    const { getBetaDeploymentSelfCheck } = await import(
      "../../lib/services/beta-deployment-self-check-service"
    );

    const result = await getBetaDeploymentSelfCheck({
      requestUrl: "https://wayv.app/internal/operator",
      viewerUserId: "viewer-1"
    });

    expect(result.envReadiness.status).toBe("ready");
    expect(result.authFlowReadiness.status).toBe("ready");
    expect(result.operatorBootstrapReadiness.status).toBe("ready_with_caution");
    expect(result.reviewExportReadiness.status).toBe("ready");
    expect(result.overallStatus).toBe("ready_with_caution");
    expect(result.operatorBootstrapReadiness.checks.seededOperatorPresent).toBe(false);
    expect(result.operatorBootstrapReadiness.checks.viewerHasOperatorAccess).toBe(true);
  });

  it("reports a blocked state when critical env values are missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.CRON_SECRET;

    const { getBetaDeploymentSelfCheck } = await import(
      "../../lib/services/beta-deployment-self-check-service"
    );

    const result = await getBetaDeploymentSelfCheck({
      requestUrl: "https://wayv.app/internal/operator"
    });

    expect(result.envReadiness.status).toBe("blocked");
    expect(result.overallStatus).toBe("blocked");
  });
});
