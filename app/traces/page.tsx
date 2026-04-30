import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { systemCopy } from "@/lib/copy/system-copy";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { listRecentPrivateResonanceTraces } from "@/lib/services/private-resonance-service";
import { getViewerContext } from "@/lib/services/viewer-service";
import { formatDateTime } from "@/lib/utils";

export default async function TracesPage() {
  const viewer = await getViewerContext();
  const approvedViewer = await enforceApprovedViewerPageAccess({ viewer, nextPath: "/traces" });
  const traces = await listRecentPrivateResonanceTraces(approvedViewer.userId, 24);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={systemCopy.privateResonance.listTitle}
        description={systemCopy.privateResonance.listDescription}
      />

      <SectionCard>
        {traces.length ? (
          <div className="grid gap-3">
            {traces.map((trace) => (
              <article
                key={trace.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip
                    label={systemCopy.privateResonance.choices[trace.resonanceChoice]}
                    tone="quiet"
                  />
                  <span className="text-xs text-slate-500">{formatDateTime(trace.createdAt)}</span>
                </div>
                <h2 className="mt-3 text-lg font-medium text-slate-950">
                  {trace.postTitle ?? systemCopy.wave.untitled}
                </h2>
                {trace.privateNote ? (
                  <p className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                    {trace.privateNote}
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-7 text-slate-600">{trace.postBodySnippet}</p>
                )}
                <div className="mt-4">
                  {trace.postVisible ? (
                    <Link
                      href={`/wave/${trace.postId}`}
                      className="text-sm font-medium text-cyan-900 underline-offset-4 hover:underline"
                    >
                      {systemCopy.privateResonance.openWave}
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-500">{systemCopy.moderation.interactionsPaused}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-7 text-slate-600">{systemCopy.privateResonance.empty}</p>
        )}
      </SectionCard>
    </div>
  );
}
