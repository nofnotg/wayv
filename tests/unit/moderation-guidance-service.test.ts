import { describe, expect, it } from "vitest";

import { buildWaveKeeperGuidance } from "@/lib/services/moderation-guidance-service";

describe("moderation guidance service", () => {
  it("uses the wave keeper seed without blunt negative phrasing", () => {
    const guidance = buildWaveKeeperGuidance({
      reasons: ["privacy_exposure"],
      text: "카톡으로 바로 연락 주세요.",
      targetType: "comment_body",
      userId: "viewer-1"
    });

    expect(guidance).not.toBeNull();
    expect(guidance?.persona).toBe("wave_keeper");
    expect(`${guidance?.title} ${guidance?.description}`).not.toContain("맞지 않아요");
    expect(`${guidance?.title} ${guidance?.description}`).not.toContain("남길 수 없어요");
    expect(`${guidance?.title} ${guidance?.description}`).not.toContain("막고 있어요");
    expect(`${guidance?.title} ${guidance?.description}`).not.toContain("멈출게요");
  });

  it("keeps crisis guidance direct enough for safety", () => {
    const guidance = buildWaveKeeperGuidance({
      reasons: ["crisis_signal"],
      text: "자살 생각이 계속 돌아요.",
      targetType: "post_body",
      userId: "viewer-2"
    });

    expect(guidance).not.toBeNull();
    expect(guidance?.family).toBe("crisis_signal");
    expect(`${guidance?.title} ${guidance?.description}`).toMatch(/안전|1393|119/);
  });
});
