import type {
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason,
  ContentGuardrailResult
} from "@/lib/domain/types";

type CommentCultureDecision = "allow" | "guide" | "hold" | "block";

type CommentCultureRule = {
  decision: Exclude<CommentCultureDecision, "allow">;
  reason: ContentGuardrailReason;
  matchedTerm: string;
  guidanceFamily: ContentGuardrailGuidanceFamily;
  description: string;
};

const ADVICE_GUIDANCE =
  "이 말은 조언처럼 닿을 수 있어요. 의견보다 공감에 가까운 말로 다시 남겨볼까요?";
const COMMAND_GUIDANCE =
  "지금 문장은 상대를 고치려는 말처럼 느껴질 수 있어요. 작은 마음만 짧게 남겨도 충분해요.";
const BLAME_GUIDANCE =
  "이 표현은 글쓴이에게 날카롭게 닿을 수 있어요. 같은 마음을 조금 더 덜 다치게 남겨볼 수 있어요.";
const PRIVACY_GUIDANCE =
  "연락처나 개인 정보는 파도 위에 오래 남을 수 있어요. 안전을 위해 그 부분은 남기지 않도록 할게요.";

const directCommandTerms = [
  "하세요",
  "해보세요",
  "그만하세요",
  "참으세요",
  "버티세요",
  "정리하세요",
  "차단하세요",
  "헤어지세요",
  "만나지 마세요",
  "상담받으세요",
  "병원 가세요",
  "정신 차려"
];

const solutionTerms = [
  "방법은",
  "해결책",
  "정답은",
  "무조건",
  "이렇게 하면",
  "제 생각엔",
  "해야 합니다",
  "해야 돼",
  "하면 됩니다"
];

const diagnosisTerms = [
  "문제는 당신",
  "당신 문제",
  "그 사람은 이상",
  "우울증",
  "회피형",
  "착각",
  "집착",
  "노력 부족"
];

const blameTerms = [
  "너무 예민",
  "네가 잘못",
  "당신이 잘못",
  "그건 별거",
  "그 정도는",
  "다들 하는데",
  "핑계"
];

const contactTerms = [
  "카톡",
  "오픈채팅",
  "DM",
  "디엠",
  "연락주세요",
  "전화번호",
  "이메일",
  "인스타",
  "텔레그램",
  "kakao",
  "telegram"
];

function normalizeForCommentGuardrail(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s\-_.,!?/\\()[\]{}<>|"'`~@#$%^&*+=:;]+/g, "");
}

function includesAny(normalized: string, terms: string[]) {
  return terms.find((term) => normalized.includes(normalizeForCommentGuardrail(term))) ?? null;
}

function buildResult(input: {
  body: string;
  rule: CommentCultureRule;
}): ContentGuardrailResult {
  const action =
    input.rule.decision === "block"
      ? "hard_block"
      : input.rule.decision === "hold"
        ? "soft_hold"
        : "allow_with_guidance";

  return {
    targetType: "comment_body",
    action,
    severity: input.rule.decision === "block" ? "high" : input.rule.decision === "hold" ? "medium" : "low",
    reasons: [input.rule.reason],
    matchedTerms: [input.rule.matchedTerm],
    contentExcerpt: input.body.trim().slice(0, 140) || null,
    suggestedAction: action,
    guidance: {
      persona: "wave_keeper",
      family: input.rule.guidanceFamily,
      title: "짧은 공명으로 다시 남겨볼까요?",
      description: input.rule.description
    }
  };
}

export function evaluateCommentCultureGuardrail(body: string): ContentGuardrailResult {
  const normalized = normalizeForCommentGuardrail(body);

  const contactTerm = includesAny(normalized, contactTerms);
  const hasEmail = /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(body);
  const hasPhone = /\b01[016789][- .]?\d{3,4}[- .]?\d{4}\b/.test(body);
  if (contactTerm || hasEmail || hasPhone) {
    return buildResult({
      body,
      rule: {
        decision: "block",
        reason: "privacy_exposure",
        matchedTerm: contactTerm ?? (hasEmail ? "email-pattern" : "phone-pattern"),
        guidanceFamily: "privacy_exposure",
        description: PRIVACY_GUIDANCE
      }
    });
  }

  const blameTerm = includesAny(normalized, [...diagnosisTerms, ...blameTerms]);
  if (blameTerm) {
    return buildResult({
      body,
      rule: {
        decision: "block",
        reason: "blame_or_attack",
        matchedTerm: blameTerm,
        guidanceFamily: "blame_or_attack",
        description: BLAME_GUIDANCE
      }
    });
  }

  const commandTerm = includesAny(normalized, directCommandTerms);
  if (commandTerm) {
    return buildResult({
      body,
      rule: {
        decision: "hold",
        reason: "unsolicited_advice",
        matchedTerm: commandTerm,
        guidanceFamily: "advice_or_preaching",
        description: COMMAND_GUIDANCE
      }
    });
  }

  const solutionTerm = includesAny(normalized, solutionTerms);
  if (solutionTerm) {
    return buildResult({
      body,
      rule: {
        decision: "guide",
        reason: "unsolicited_advice",
        matchedTerm: solutionTerm,
        guidanceFamily: "advice_or_preaching",
        description: ADVICE_GUIDANCE
      }
    });
  }

  return {
    targetType: "comment_body",
    action: "allow",
    severity: "low",
    reasons: [],
    matchedTerms: [],
    contentExcerpt: body.trim().slice(0, 140) || null,
    suggestedAction: null,
    guidance: null
  };
}
