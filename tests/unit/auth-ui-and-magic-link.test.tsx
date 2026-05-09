import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

globalThis.React = React;

vi.mock("@/lib/services/auth-service", () => ({
  passwordSignInAction: vi.fn(),
  socialSignInAction: vi.fn()
}));

describe("auth UI and disabled magic-link login", () => {
  it("renders password and social login without the magic-link form", async () => {
    const { SignInForm } = await import("@/features/auth/sign-in-form");
    const html = renderToStaticMarkup(<SignInForm nextPath="/beta/apply" />);

    expect(html).toContain("구글 계정으로 로그인");
    expect(html).toContain("카카오 계정으로 로그인");
    expect(html).toContain("회원가입");
    expect(html).toContain("비밀번호 찾기 문의");
    expect(html).not.toContain("email-link-login");
    expect(html).not.toContain("이메일 링크 받기");
  });

  it("returns gone for the old magic-link API", async () => {
    const { POST } = await import("@/app/api/auth/signin/route");
    const response = await POST();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({ error: "magic-link-disabled" });
  });
});
