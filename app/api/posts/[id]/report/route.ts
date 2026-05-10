import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import { createModerationReport } from "@/lib/services/reporting-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type ReportRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: ReportRouteProps) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }
  const approvedViewer = viewer!;

  const { id } = await params;
  const body = await request.json();

  try {
    const report = await createModerationReport(body, "post", id, approvedViewer.userId);
    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
