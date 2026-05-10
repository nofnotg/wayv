import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { afterEach, describe, expect, it, vi } from "vitest";

globalThis.React = React;

const getViewerContext = vi.fn();

vi.mock("@/lib/services/viewer-service", () => ({
  getViewerContext
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
  }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  )
}));

vi.mock("@/components/beta-access-state-card", () => ({
  BetaAccessStateCard: ({ access }: { access: { status: string } }) => (
    <div>{`beta-state:${access.status}`}</div>
  )
}));

vi.mock("@/features/beta/beta-application-form", () => ({
  BetaApplicationForm: ({
    currentStatus
  }: {
    currentStatus: string | null;
  }) => <div>{`beta-form:${currentStatus ?? "none"}`}</div>
}));

describe("beta apply page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the application form without a state card for logged-in users who have not applied", async () => {
    getViewerContext.mockResolvedValue({
      email: "user@example.com",
      profile: { nickname: "wave-user" },
      betaAccess: null
    });

    const Page = (await import("../../app/beta/apply/page")).default;
    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("beta-form:none");
    expect(html).not.toContain("beta-state:");
  });

  it("shows the existing beta state card for pending users", async () => {
    getViewerContext.mockResolvedValue({
      email: "user@example.com",
      profile: { nickname: "wave-user" },
      betaAccess: { status: "pending" }
    });

    const Page = (await import("../../app/beta/apply/page")).default;
    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("beta-state:pending");
    expect(html).toContain("beta-form:pending");
  });
});
