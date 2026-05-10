import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import type { ViewerContext } from "@/lib/services/viewer-service";

export function isApprovedViewer(viewer: ViewerContext | null | undefined) {
  return viewer?.betaAccess?.status === "approved" || Boolean(viewer?.operatorAccess);
}

export function getBetaAccessDeniedPayload(viewer: ViewerContext) {
  return {
    error: "beta-access-denied",
    status: viewer.betaAccess?.status ?? null,
    applicationRequired: !viewer.betaAccess
  };
}

export function enforceApprovedViewerPageAccess(input: {
  viewer: ViewerContext | null;
  nextPath: string;
  requireOnboarding?: boolean;
}) {
  if (!input.viewer) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(input.nextPath)}`);
  }

  if (!isApprovedViewer(input.viewer)) {
    redirect("/");
  }

  const requireOnboarding = input.requireOnboarding ?? true;
  if (
    requireOnboarding &&
    !input.viewer.operatorAccess &&
    input.viewer.profile &&
    !input.viewer.profile.onboardingCompletedAt
  ) {
    redirect(`/onboarding?next=${encodeURIComponent(input.nextPath)}`);
  }

  return input.viewer;
}

export function buildApprovedViewerApiGuard(
  viewer: ViewerContext | null,
  options: { requireOnboarding?: boolean } = {}
) {
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isApprovedViewer(viewer)) {
    return NextResponse.json(getBetaAccessDeniedPayload(viewer), { status: 403 });
  }

  const requireOnboarding = options.requireOnboarding ?? true;
  if (requireOnboarding && !viewer.operatorAccess && viewer.profile && !viewer.profile.onboardingCompletedAt) {
    return NextResponse.json(
      {
        error: "onboarding-required",
        next: "/onboarding"
      },
      { status: 403 }
    );
  }

  return null;
}
