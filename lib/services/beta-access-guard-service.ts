import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import type { ViewerContext } from "@/lib/services/viewer-service";

export function isApprovedViewer(viewer: ViewerContext | null | undefined) {
  return viewer?.betaAccess.status === "approved";
}

export function getBetaAccessDeniedPayload(viewer: ViewerContext) {
  return {
    error: "beta-access-denied",
    status: viewer.betaAccess.status
  };
}

export function enforceApprovedViewerPageAccess(input: {
  viewer: ViewerContext | null;
  nextPath: string;
}) {
  if (!input.viewer) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(input.nextPath)}`);
  }

  if (!isApprovedViewer(input.viewer)) {
    redirect("/");
  }

  return input.viewer;
}

export function buildApprovedViewerApiGuard(viewer: ViewerContext | null) {
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isApprovedViewer(viewer)) {
    return NextResponse.json(getBetaAccessDeniedPayload(viewer), { status: 403 });
  }

  return null;
}
