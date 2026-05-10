import { afterEach, describe, expect, it, vi } from "vitest";

const getViewerContext = vi.fn();
const submitBetaApplication = vi.fn();

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

vi.mock("@/lib/services/beta-access-service", () => ({
  submitBetaApplication
}));

describe("beta application route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows logged-out beta application submission", async () => {
    getViewerContext.mockResolvedValue(null);
    submitBetaApplication.mockResolvedValue({
      id: "request-1",
      status: "pending"
    });
    const { POST } = await import("../../app/api/beta/apply/route");

    const response = await POST(
      new Request("http://localhost/api/beta/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "beta@example.com",
          applicantName: "beta user",
          applicationNote: "실패 이야기를 조용히 나누고 싶어요."
        })
      }) as never
    );

    expect(submitBetaApplication).toHaveBeenCalledWith({
      email: "beta@example.com",
      applicantName: "beta user",
      applicationNote: "실패 이야기를 조용히 나누고 싶어요.",
      userId: null
    });
    expect(response.status).toBe(201);
  });

  it("attaches signed-in viewer id when available", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    submitBetaApplication.mockResolvedValue({
      id: "request-1",
      status: "pending"
    });
    const { POST } = await import("../../app/api/beta/apply/route");

    await POST(
      new Request("http://localhost/api/beta/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "viewer@example.com",
          applicationNote: "이미 로그인했지만 승인 신청을 남길게요."
        })
      }) as never
    );

    expect(submitBetaApplication).toHaveBeenCalledWith({
      email: "viewer@example.com",
      applicationNote: "이미 로그인했지만 승인 신청을 남길게요.",
      userId: "viewer-1"
    });
  });
});
