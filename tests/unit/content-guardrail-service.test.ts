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

  it("guides unsolicited advice without rewriting text", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "comment_body",
        text: "정신 차리고 그냥 버텨. 시간이 지나면 괜찮아질 거야."
      })
    ).toMatchObject({
      action: "allow_with_guidance",
      reasons: expect.arrayContaining(["unsolicited_advice"])
    });
  });

  it("soft-holds ridicule and mockery", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "comment_body",
        text: "진짜 한심하다. 꼴값 좀 그만 떨어."
      })
    ).toMatchObject({
      action: "soft_hold",
      reasons: expect.arrayContaining(["ridicule_or_mockery"])
    });
  });

  it("soft-holds blame and attack", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "post_body",
        text: "너 때문이야. 네가 잘못한 거야."
      })
    ).toMatchObject({
      action: "soft_hold",
      reasons: expect.arrayContaining(["blame_or_attack"])
    });
  });

  it("hard-blocks obvious privacy exposure", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "feedback_message",
        text: "010-1234-5678로 바로 연락 주세요."
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
        text: "죽고 싶다는 생각이 계속 올라와요."
      })
    ).toMatchObject({
      action: "safety_hold",
      reasons: expect.arrayContaining(["crisis_signal"])
    });
  });

  it("detects mixed-script and obfuscated profanity", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "comment_body",
        text: "f.u.c.k this"
      })
    ).toMatchObject({
      action: "hard_block",
      reasons: expect.arrayContaining(["evasion_pattern"])
    });
  });

  it("detects obfuscated crisis shorthand", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "post_body",
        text: "ㅈ ㅅ 하고 싶다는 말이 계속 돌아요."
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
