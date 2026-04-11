import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { afterEach, describe, expect, it, vi } from "vitest";

globalThis.React = React;

const getViewerContext = vi.fn();
const getStoredSeedProfile = vi.fn();
const buildHomeFeed = vi.fn();
const getLoggedOutHomeCopy = vi.fn();

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
}));

vi.mock("@/lib/services/onboarding-service", () => ({
  getStoredSeedProfile
}));

vi.mock("@/lib/services/feed-service", () => ({
  buildHomeFeed,
  getLoggedOutHomeCopy
}));

vi.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title, description }: { title: string; description?: string }) => (
    <header>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </header>
  )
}));

vi.mock("@/components/section-card", () => ({
  SectionCard: ({
    children,
    title
  }: {
    children: React.ReactNode;
    title?: string;
    className?: string;
  }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  )
}));

vi.mock("@/components/setup-banner", () => ({
  SetupBanner: () => <div>setup-banner</div>
}));

vi.mock("@/components/status-chip", () => ({
  StatusChip: ({ label }: { label: string }) => <span>{label}</span>
}));

vi.mock("@/components/beta-access-state-card", () => ({
  BetaAccessStateCard: ({ access }: { access: { status: string } }) => (
    <div>{`beta-state:${access.status}`}</div>
  )
}));

vi.mock("@/features/feed/wave-card", () => ({
  WaveCard: ({ post }: { post: { id: string } }) => <article>{post.id}</article>
}));

describe("home page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows beta apply entry for logged-out users", async () => {
    getViewerContext.mockResolvedValue(null);
    getLoggedOutHomeCopy.mockReturnValue({
      title: "logged-out-title",
      description: "logged-out-description"
    });

    const Page = (await import("../../app/page")).default;
    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("logged-out-title");
    expect(html).toContain("\ubca0\ud0c0 \uc2e0\uccad");
  });

  it("shows explicit apply-only surface for logged-in users without an application", async () => {
    getViewerContext.mockResolvedValue({
      userId: "viewer-1",
      profile: { nickname: "wave-user" },
      betaAccess: null
    });

    const Page = (await import("../../app/page")).default;
    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("\ubca0\ud0c0 \uc2e0\uccad\uc744 \uba3c\uc800 \ub0a8\uaca8 \uc8fc\uc138\uc694");
    expect(html).toContain("\ubca0\ud0c0 \uc2e0\uccad\ud558\uae30");
  });

  it("shows waiting-state surface for pending users", async () => {
    getViewerContext.mockResolvedValue({
      userId: "viewer-1",
      profile: { nickname: "wave-user" },
      betaAccess: { status: "pending" }
    });

    const Page = (await import("../../app/page")).default;
    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("beta-state:pending");
  });

  it("lets approved users continue to onboarding when onboarding is incomplete", async () => {
    getViewerContext.mockResolvedValue({
      userId: "viewer-1",
      profile: { nickname: "wave-user", onboardingCompletedAt: null },
      betaAccess: { status: "approved" }
    });

    const Page = (await import("../../app/page")).default;
    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("/onboarding");
  });
});
