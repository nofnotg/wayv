import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";

import type { ProductPlan } from "@/lib/domain/types";
import { getOperatorAccess } from "@/lib/services/operator-access-service";
import { getViewerContext } from "@/lib/services/viewer-service";
import { sanitizeNextPath } from "@/lib/supabase/env";
import { operatorPlanPreviewSchema } from "@/lib/validation/schemas";

const PLAN_PREVIEW_COOKIE = "wayv_operator_plan_preview";

export function getPlanLabel(plan: ProductPlan) {
  if (plan === "free") {
    return "Free";
  }

  if (plan === "swim") {
    return "Swim";
  }

  return "Surfer";
}

export function getPlanPreviewFeatures(plan: ProductPlan) {
  if (plan === "free") {
    return {
      canWrite: false,
      canUsePrivateTraces: false,
      canUseNotifications: false,
      description: "흐름을 느끼는 읽기 중심 모드"
    };
  }

  return {
    canWrite: true,
    canUsePrivateTraces: true,
    canUseNotifications: true,
    description: "wayv의 현재 핵심 흐름을 모두 여는 메인 모드"
  };
}

export async function getOperatorPlanPreview(viewerUserId: string | null | undefined) {
  if (!viewerUserId) {
    return "swim" satisfies ProductPlan;
  }

  const operatorAccess = await getOperatorAccess(viewerUserId);
  if (!operatorAccess) {
    return "swim" satisfies ProductPlan;
  }

  const cookieStore = await cookies();
  const value = cookieStore.get(PLAN_PREVIEW_COOKIE)?.value;
  return value === "free" ? "free" : "swim";
}

export async function setOperatorPlanPreviewAction(formData: FormData) {
  "use server";

  const parsed = operatorPlanPreviewSchema.safeParse({
    plan: String(formData.get("plan") ?? "swim"),
    next: String(formData.get("next") ?? "/")
  });

  if (!parsed.success) {
    redirect("/");
  }

  const viewer = await getViewerContext();
  if (!viewer?.operatorAccess) {
    redirect("/");
  }

  const cookieStore = await cookies();
  cookieStore.set(PLAN_PREVIEW_COOKIE, parsed.data.plan, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });

  redirect(sanitizeNextPath(parsed.data.next) as Route);
}
