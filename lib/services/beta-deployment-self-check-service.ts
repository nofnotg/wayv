import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  getAppUrl,
  getAuthCallbackUrl,
  getCronSecret,
  getMobileAuthRedirects,
  hasSupabaseEnv
} from "@/lib/supabase/env";

import { listBetaFeedback } from "@/lib/services/beta-feedback-service";
import { listContentGuardrailFlags } from "@/lib/services/content-guardrail-service";
import { getOperatorAccess } from "@/lib/services/operator-access-service";
import { listProductEvents } from "@/lib/services/product-event-service";

export type BetaSelfCheckStatus = "ready" | "ready_with_caution" | "blocked";

type BetaSelfCheckBucket = {
  status: BetaSelfCheckStatus;
  summary: string;
  checks: Record<string, boolean | null>;
};

export type BetaDeploymentSelfCheck = {
  checkedAt: string;
  request: {
    origin: string | null;
    host: string | null;
  };
  envReadiness: BetaSelfCheckBucket & {
    appOrigin: string | null;
    authRedirectOrigin: string | null;
  };
  authFlowReadiness: BetaSelfCheckBucket;
  operatorBootstrapReadiness: BetaSelfCheckBucket;
  reviewExportReadiness: BetaSelfCheckBucket;
  overallStatus: BetaSelfCheckStatus;
  notes: string[];
};

function buildBucket(input: {
  blockedWhenFalse?: string[];
  cautionWhenFalse?: string[];
  checks: Record<string, boolean | null>;
  readySummary: string;
  cautionSummary: string;
  blockedSummary: string;
}): BetaSelfCheckBucket {
  const blocked = (input.blockedWhenFalse ?? []).some((key) => input.checks[key] === false);
  if (blocked) {
    return {
      status: "blocked",
      summary: input.blockedSummary,
      checks: input.checks
    };
  }

  const caution = (input.cautionWhenFalse ?? []).some((key) => input.checks[key] === false);
  if (caution) {
    return {
      status: "ready_with_caution",
      summary: input.cautionSummary,
      checks: input.checks
    };
  }

  return {
    status: "ready",
    summary: input.readySummary,
    checks: input.checks
  };
}

function parseOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getOverallStatus(statuses: BetaSelfCheckStatus[]) {
  if (statuses.includes("blocked")) {
    return "blocked";
  }

  if (statuses.includes("ready_with_caution")) {
    return "ready_with_caution";
  }

  return "ready";
}

async function getOperatorBootstrapChecks(viewerUserId?: string | null) {
  const checks: Record<string, boolean | null> = {
    adminQueryReady: hasSupabaseEnv() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    internalOperatorsReachable: null,
    seededOperatorPresent: null,
    viewerHasOperatorAccess: viewerUserId ? null : null
  };

  if (!checks.adminQueryReady) {
    return checks;
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { count, error } = await supabase
      .from("internal_operators")
      .select("user_id", { count: "exact", head: true })
      .eq("is_active", true);

    if (error) {
      checks.internalOperatorsReachable = false;
      checks.seededOperatorPresent = false;
    } else {
      checks.internalOperatorsReachable = true;
      checks.seededOperatorPresent = Boolean((count ?? 0) > 0);
    }
  } catch {
    checks.internalOperatorsReachable = false;
    checks.seededOperatorPresent = false;
  }

  if (viewerUserId) {
    try {
      checks.viewerHasOperatorAccess = Boolean(await getOperatorAccess(viewerUserId));
    } catch {
      checks.viewerHasOperatorAccess = false;
    }
  }

  return checks;
}

async function getReviewExportChecks() {
  const checks: Record<string, boolean | null> = {
    betaFeedbackReviewReady: null,
    productEventsReviewReady: null,
    contentGuardrailReviewReady: null
  };

  try {
    await listBetaFeedback({ limit: 1 });
    checks.betaFeedbackReviewReady = true;
  } catch {
    checks.betaFeedbackReviewReady = false;
  }

  try {
    await listProductEvents({ limit: 1 });
    checks.productEventsReviewReady = true;
  } catch {
    checks.productEventsReviewReady = false;
  }

  try {
    await listContentGuardrailFlags({ limit: 1 });
    checks.contentGuardrailReviewReady = true;
  } catch {
    checks.contentGuardrailReviewReady = false;
  }

  return checks;
}

export async function getBetaDeploymentSelfCheck(input?: {
  requestUrl?: string | null;
  viewerUserId?: string | null;
}): Promise<BetaDeploymentSelfCheck> {
  const requestOrigin = parseOrigin(input?.requestUrl);
  const requestHost = requestOrigin ? new URL(requestOrigin).host : null;
  const appOrigin = parseOrigin(getAppUrl());
  const authRedirectOrigin = parseOrigin(getAuthCallbackUrl());

  const envChecks: Record<string, boolean | null> = {
    publicSupabaseEnvReady: hasSupabaseEnv(),
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    authRedirectConfigured: Boolean(process.env.SUPABASE_REDIRECT_URL),
    serviceRoleReady: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    cronSecretReady: Boolean(getCronSecret()),
    mobileRedirectsConfigured: getMobileAuthRedirects().length > 0
  };

  const envReadiness = buildBucket({
    blockedWhenFalse: ["publicSupabaseEnvReady", "serviceRoleReady", "cronSecretReady"],
    cautionWhenFalse: ["appUrlConfigured", "authRedirectConfigured", "mobileRedirectsConfigured"],
    checks: envChecks,
    readySummary: "배포에 필요한 환경값이 모두 연결돼 있어요.",
    cautionSummary: "핵심 환경값은 보이지만 배포 전에 한 번 더 맞춰볼 항목이 남아 있어요.",
    blockedSummary: "핵심 환경값이 비어 있어 배포 베타 점검을 통과하기 어려워요."
  });

  const authChecks: Record<string, boolean | null> = {
    requestHostKnown: Boolean(requestHost),
    appOriginKnown: Boolean(appOrigin),
    authRedirectKnown: Boolean(authRedirectOrigin),
    appHostMatchesRequestHost:
      requestHost && appOrigin ? new URL(appOrigin).host === requestHost : null,
    authRedirectMatchesAppHost:
      authRedirectOrigin && appOrigin
        ? new URL(authRedirectOrigin).host === new URL(appOrigin).host
        : null
  };

  const authFlowReadiness = buildBucket({
    blockedWhenFalse: ["appOriginKnown"],
    cautionWhenFalse: ["requestHostKnown", "appHostMatchesRequestHost", "authRedirectMatchesAppHost"],
    checks: authChecks,
    readySummary: "현재 요청 호스트와 인증 복귀 대상이 자연스럽게 이어지고 있어요.",
    cautionSummary: "인증 복귀 경로는 보이지만 배포 호스트와 다시 맞춰볼 필요가 있어요.",
    blockedSummary: "기본 앱 URL이 없어 인증 복귀 경로를 신뢰하기 어려워요."
  });

  const operatorChecks = await getOperatorBootstrapChecks(input?.viewerUserId);
  const operatorBootstrapReadiness = buildBucket({
    blockedWhenFalse: ["adminQueryReady", "internalOperatorsReachable"],
    cautionWhenFalse: ["seededOperatorPresent"],
    checks: operatorChecks,
    readySummary: "운영자 권한 테이블에 접근할 수 있고 첫 운영자 seed도 확인돼요.",
    cautionSummary: "운영자 권한 테이블은 보이지만 첫 운영자 seed를 다시 확인해야 해요.",
    blockedSummary: "운영자 권한 테이블에 접근할 수 없어 bootstrap 상태를 확인할 수 없어요."
  });

  const reviewChecks = await getReviewExportChecks();
  const reviewExportReadiness = buildBucket({
    blockedWhenFalse: [
      "betaFeedbackReviewReady",
      "productEventsReviewReady",
      "contentGuardrailReviewReady"
    ],
    checks: reviewChecks,
    readySummary: "피드백, 이벤트, 가드레일 검토 경로가 모두 응답하고 있어요.",
    cautionSummary: "검토 경로 응답을 한 번 더 확인해 주세요.",
    blockedSummary: "검토 경로 일부가 응답하지 않아 배포 뒤 운영 점검이 막혀 있어요."
  });

  const notes: string[] = [];

  if (envReadiness.status !== "ready") {
    notes.push("배포 환경값과 앱 호스트 정합성을 먼저 확인해 주세요.");
  }

  if (operatorBootstrapReadiness.checks.seededOperatorPresent === false) {
    notes.push("첫 운영자 계정이 아직 없다면 internal bootstrap route로 seed해 주세요.");
  }

  if (reviewExportReadiness.status !== "ready") {
    notes.push("세 review/export 경로가 실제 데이터 테이블에 접근 가능한지 다시 확인해 주세요.");
  }

  return {
    checkedAt: new Date().toISOString(),
    request: {
      origin: requestOrigin,
      host: requestHost
    },
    envReadiness: {
      ...envReadiness,
      appOrigin,
      authRedirectOrigin
    },
    authFlowReadiness,
    operatorBootstrapReadiness,
    reviewExportReadiness,
    overallStatus: getOverallStatus([
      envReadiness.status,
      authFlowReadiness.status,
      operatorBootstrapReadiness.status,
      reviewExportReadiness.status
    ]),
    notes
  };
}
