import { NextRequest, NextResponse } from "next/server";

import { createModerationReport } from "@/lib/services/reporting-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type ReportRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: ReportRouteProps) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const report = await createModerationReport(body, "post", id, viewer.userId);
    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
