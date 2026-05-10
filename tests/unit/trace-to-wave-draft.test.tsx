import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { afterEach, describe, expect, it, vi } from "vitest";

globalThis.React = React;

const enforceApprovedViewerPageAccess = vi.fn();
const getPrivateResonanceWaveDraftPrefill = vi.fn();
const getViewerContext = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect
}));

vi.mock("@/lib/services/beta-access-guard-service", () => ({
  enforceApprovedViewerPageAccess
}));

vi.mock("@/lib/services/private-resonance-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/private-resonance-service")>(
    "@/lib/services/private-resonance-service"
  );
  return {
    ...actual,
    getPrivateResonanceWaveDraftPrefill
  };
});

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

vi.mock("@/lib/services/posts-service", () => ({
  createWavePostAction: vi.fn()
}));

describe("trace to wave draft", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds prefill text from private note without rewriting", async () => {
    const { buildPrivateResonanceWaveDraftBody } = await import(
      "@/lib/services/private-resonance-service"
    );

    expect(
      buildPrivateResonanceWaveDraftBody({
        privateNote: "내 안에 남은 문장",
        postBodySnippet: "원문 일부"
      })
    ).toBe("내 안에 남은 문장");
  });

  it("verifies the owner before redirecting to the write prefill route", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    enforceApprovedViewerPageAccess.mockResolvedValue({ userId: "viewer-1" });
    getPrivateResonanceWaveDraftPrefill.mockResolvedValue({
      traceId: "trace-1",
      body: "내 안에 남은 문장"
    });

    const Page = (await import("@/app/traces/[traceId]/wave-draft/page")).default;

    await expect(Page({ params: Promise.resolve({ traceId: "trace-1" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/write?sourceTraceId=trace-1"
    );
    expect(getPrivateResonanceWaveDraftPrefill).toHaveBeenCalledWith("trace-1", "viewer-1");
  });

  it("does not expose private note in the redirect URL", async () => {
    getViewerContext.mockResolvedValue({ userId: "viewer-1" });
    enforceApprovedViewerPageAccess.mockResolvedValue({ userId: "viewer-1" });
    getPrivateResonanceWaveDraftPrefill.mockResolvedValue({
      traceId: "trace-1",
      body: "private note should stay server side"
    });

    const Page = (await import("@/app/traces/[traceId]/wave-draft/page")).default;

    await expect(Page({ params: Promise.resolve({ traceId: "trace-1" }) })).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(redirect).toHaveBeenCalledWith("/write?sourceTraceId=trace-1");
    expect(String(redirect.mock.calls[0]?.[0])).not.toContain("private note");
  });

  it("renders a draft form without publishing until explicit submit", async () => {
    const { WriteForm } = await import("@/features/write/write-form");
    const html = renderToStaticMarkup(
      <WriteForm initialBody="내 안에 남은 문장" sourceTraceMode />
    );

    expect(html).toContain("내 안에 남은 문장");
    expect(html).toContain("바로 공개되지 않아요");
    expect(html).toContain("파도 남기기");
  });
});
