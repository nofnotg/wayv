import { describe, expect, it } from "vitest";

import { evaluateContentGuardrail } from "@/lib/services/content-guardrail-service";

describe("content guardrail service", () => {
  it("allows calm text", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "post_body",
        text: "오늘은 조금 지쳤지만 천천히 적어 보고 있어요."
      })
    ).toMatchObject({
      action: "allow",
      reasons: []
    });
  });

  it("returns guidance for harsh tone", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "comment_body",
        text: "진짜 너무 거칠게 말하고 싶어요!!!!"
      })
    ).toMatchObject({
      action: "allow_with_guidance",
      reasons: expect.arrayContaining(["harsh_tone"])
    });
  });

  it("hard-blocks obvious privacy exposure", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "feedback_message",
        text: "010-1234-5678 로 바로 연락 주세요."
      })
    ).toMatchObject({
      action: "hard_block",
      reasons: expect.arrayContaining(["privacy_exposure"])
    });
  });

  it("safety-holds crisis wording", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "post_body",
        text: "그만 사라지고 싶다는 생각이 계속 올라와요."
      })
    ).toMatchObject({
      action: "safety_hold",
      reasons: expect.arrayContaining(["crisis_signal"])
    });
  });

  it("supports a bounded allowlist for tuning", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "comment_body",
        text: "시발",
        allowlist: {
          explicit_profanity: ["시발"]
        }
      })
    ).toMatchObject({
      action: "allow",
      reasons: []
    });
  });
});
