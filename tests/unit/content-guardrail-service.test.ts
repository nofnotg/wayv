import { describe, expect, it } from "vitest";

import { evaluateContentGuardrail } from "@/lib/services/content-guardrail-service";

describe("content guardrail service", () => {
  it("allows calm text", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "post_body",
        text: "오늘은 조금 지쳤지만 천천히 견뎌 보고 있어요."
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
        text: "진짜 웃기네. 비웃고 싶어질 정도야."
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
        text: "한심하다. 네 탓이야."
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
        text: "카톡id는 quiet-wave이고 010-1234-5678로 연락 주세요."
      })
    ).toMatchObject({
      action: "hard_block",
      reasons: expect.arrayContaining(["privacy_exposure"])
    });
  });

  it("hard-blocks external pull attempts", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "beta_application_note",
        text: "telegram으로 주세요. t.me/wayvbeta"
      })
    ).toMatchObject({
      action: "hard_block",
      reasons: expect.arrayContaining(["spam_or_external_pull"])
    });
  });

  it("safety-holds crisis wording", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "post_body",
        text: "죽고 싶다는 생각이 계속 돌아요."
      })
    ).toMatchObject({
      action: "safety_hold",
      reasons: expect.arrayContaining(["crisis_signal"])
    });
  });

  it("detects keyboard-switched profanity from the normalization seed", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "comment_body",
        text: "tlqkf 같은 말이 자꾸 떠올라요."
      })
    ).toMatchObject({
      action: "hard_block",
      reasons: expect.arrayContaining(["explicit_profanity", "evasion_pattern"])
    });
  });

  it("detects phonetic latin profanity from the normalization seed", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "comment_body",
        text: "sibal 같은 말로 튀어나오려 해요."
      })
    ).toMatchObject({
      action: "hard_block",
      reasons: expect.arrayContaining(["explicit_profanity", "evasion_pattern"])
    });
  });

  it("detects obfuscated crisis shorthand from the normalization seed", () => {
    expect(
      evaluateContentGuardrail({
        targetType: "post_body",
        text: "ㅈ ㅅ 생각이 스쳐 가서 무서워요."
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
