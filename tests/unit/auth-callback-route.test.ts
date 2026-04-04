import { afterEach, describe, expect, it, vi } from "vitest";

const exchangeAuthCodeForSession = vi.fn();
const exchangeTokenHashForSession = vi.fn();

vi.mock("@/lib/services/auth-service", () => ({
  exchangeAuthCodeForSession,
  exchangeTokenHashForSession
}));

describe("auth callback route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to sign-in when no auth token is present", async () => {
    const { GET } = await import("../../app/auth/callback/route");
    const response = await GET(
      new Request("http://localhost:3001/auth/callback?next=/internal/operator") as never
    );

    expect(response.headers.get("location")).toContain("/auth/sign-in?error=missing-code");
  }, 10000);

  it("exchanges an auth code when present", async () => {
    const { GET } = await import("../../app/auth/callback/route");
    const response = await GET(
      new Request("http://localhost:3001/auth/callback?code=test-code&next=/internal/operator") as never
    );

    expect(exchangeAuthCodeForSession).toHaveBeenCalledWith("test-code");
    expect(response.headers.get("location")).toBe("http://localhost:3001/internal/operator");
  });

  it("supports token hash callbacks for magic links", async () => {
    const { GET } = await import("../../app/auth/callback/route");
    const response = await GET(
      new Request(
        "http://localhost:3001/auth/callback?token_hash=test-hash&type=magiclink&next=/internal/operator"
      ) as never
    );

    expect(exchangeTokenHashForSession).toHaveBeenCalledWith({
      tokenHash: "test-hash",
      type: "magiclink"
    });
    expect(response.headers.get("location")).toBe("http://localhost:3001/internal/operator");
  });
});
