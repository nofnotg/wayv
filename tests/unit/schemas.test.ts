import { afterEach, describe, expect, it } from "vitest";

import {
  getMobileAuthRedirects,
  isAllowedMobileAuthRedirect,
  sanitizeNextPath
} from "../../lib/supabase/env";
import {
  notificationDeviceSchema,
  privateResonanceTraceSchema,
  signInRequestSchema,
  wavePostSchema
} from "../../lib/validation/schemas";

describe("schemas and env helpers", () => {
  afterEach(() => {
    delete process.env.MOBILE_AUTH_REDIRECTS;
  });

  it("validates sign-in request", () => {
    expect(
      signInRequestSchema.parse({
        email: "hello@wayv.app",
        next: "/onboarding"
      })
    ).toEqual({
      email: "hello@wayv.app",
      next: "/onboarding"
    });
  });

  it("sanitizes open redirects", () => {
    expect(sanitizeNextPath("https://evil.example.com")).toBe("/");
    expect(sanitizeNextPath("//evil.example.com")).toBe("/");
    expect(sanitizeNextPath("/profile")).toBe("/profile");
  });

  it("parses allowed mobile auth redirects", () => {
    process.env.MOBILE_AUTH_REDIRECTS = "wayv://auth/callback, https://wayv.app/auth/callback";

    expect(getMobileAuthRedirects()).toEqual([
      "wayv://auth/callback",
      "https://wayv.app/auth/callback"
    ]);
    expect(isAllowedMobileAuthRedirect("wayv://auth/callback")).toBe(true);
    expect(isAllowedMobileAuthRedirect("wayv://unknown")).toBe(false);
  });

  it("validates notification devices and posts", () => {
    expect(
      notificationDeviceSchema.parse({
        platform: "ios",
        deviceToken: "token-12345678"
      }).platform
    ).toBe("ios");

    expect(
      wavePostSchema.parse({
        title: "첫 파도",
        body: "이건 스무 글자보다 더 길게 적은 파도 본문이에요.",
        categories: ["work"],
        emotionTags: ["anxiety"],
        visibility: "public"
      }).visibility
    ).toBe("public");
  });

  it("validates private resonance traces", () => {
    expect(
      privateResonanceTraceSchema.parse({
        resonanceChoice: "lingered",
        privateNote: "오래 남았어요.",
        sourcePath: "/wave/post-1"
      }).resonanceChoice
    ).toBe("lingered");

    expect(() =>
      privateResonanceTraceSchema.parse({
        resonanceChoice: "diagnosis",
        privateNote: "x".repeat(181)
      })
    ).toThrow();
  });
});
