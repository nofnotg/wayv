import { redirect } from "next/navigation";
import type { Route } from "next";

import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getPrivateResonanceWaveDraftPrefill } from "@/lib/services/private-resonance-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type TraceWaveDraftPageProps = {
  params: Promise<{ traceId: string }>;
};

export default async function TraceWaveDraftPage({ params }: TraceWaveDraftPageProps) {
  const { traceId } = await params;
  const viewer = await getViewerContext();
  const approvedViewer = await enforceApprovedViewerPageAccess({
    viewer,
    nextPath: `/traces/${traceId}/wave-draft`
  });

  const draft = await getPrivateResonanceWaveDraftPrefill(traceId, approvedViewer.userId);
  if (!draft) {
    redirect("/traces?draft=not-found" as Route);
  }

  redirect(`/write?sourceTraceId=${encodeURIComponent(traceId)}` as Route);
}
