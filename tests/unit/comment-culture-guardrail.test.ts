import { describe, expect, it } from "vitest";

import { evaluateCommentCultureGuardrail } from "@/lib/services/comment-culture-guardrail-service";
import { COMMENT_MAX_LENGTH, commentSchema } from "@/lib/validation/schemas";

describe("comment culture guardrail", () => {
  it("allows short resonance comments", () => {
    const result = evaluateCommentCultureGuardrail("저도 이 마음이 조금 남았어요.");

    expect(result.action).toBe("allow");
    expect(result.reasons).toEqual([]);
  });

  it("enforces a 120 character server-side limit", () => {
    expect(COMMENT_MAX_LENGTH).toBe(120);
    expect(commentSchema.safeParse({ body: "괜찮아요." }).success).toBe(true);
    expect(commentSchema.safeParse({ body: "a".repeat(121) }).success).toBe(false);
  });

  it("guides mild solution framing without rewriting user text", () => {
    const result = evaluateCommentCultureGuardrail("제 생각엔 이렇게 하면 괜찮아질 것 같아요.");

    expect(result.action).toBe("allow_with_guidance");
    expect(result.reasons).toContain("unsolicited_advice");
    expect(result.contentExcerpt).toBe("제 생각엔 이렇게 하면 괜찮아질 것 같아요.");
  });

  it("holds direct command-like advice", () => {
    const result = evaluateCommentCultureGuardrail("그만하세요. 차단하세요.");

    expect(result.action).toBe("soft_hold");
    expect(result.reasons).toContain("unsolicited_advice");
  });

  it("blocks contact info and blame-like comments", () => {
    expect(evaluateCommentCultureGuardrail("카톡으로 연락주세요.").action).toBe("hard_block");
    expect(evaluateCommentCultureGuardrail("그건 당신이 잘못한 거예요.").action).toBe(
      "hard_block"
    );
  });
});
