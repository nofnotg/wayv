import { describe, expect, it } from "vitest";

import { evaluateContentGuardrail } from "@/lib/services/content-guardrail-service";

describe("content guardrail service", () => {
  it("allows calm text", () => {
    expect(
      evaluateContentGuardrail({
        body: "오늘은 조금 지쳤지만 천천히 쉬어가려고 해요."
      })
    ).toMatchObject({
      action: "allow",
      reasons: []
    });
  });

  it("flags profanity without blocking", () => {
    expect(
      evaluateContentGuardrail({
        body: "진짜 씨발 너무 속상했어요."
      })
    ).toMatchObject({
      action: "allow_but_flag",
      reasons: ["profanity"]
    });
  });

  it("blocks obvious contact info", () => {
    expect(
      evaluateContentGuardrail({
        body: "연락 주세요 010-1234-5678 여기로 답할게요."
      })
    ).toMatchObject({
      action: "block"
    });
  });

  it("flags high risk keywords for review", () => {
    expect(
      evaluateContentGuardrail({
        body: "요즘은 그냥 죽고 싶다는 말이 자꾸 떠올라요."
      })
    ).toMatchObject({
      action: "allow_but_flag",
      reasons: expect.arrayContaining(["high_risk_keyword"])
    });
  });
});

it("supports a bounded allowlist for tuning", () => {
  expect(
    evaluateContentGuardrail({
      body: "fuck this flow",
      allowlist: {
        profanity: ["fuck"]
      }
    })
  ).toMatchObject({
    action: "allow",
    reasons: []
  });
});
