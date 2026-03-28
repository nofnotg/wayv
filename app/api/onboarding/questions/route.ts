import { NextResponse } from "next/server";

import { getQuestionFlow } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function GET() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    questions: getQuestionFlow([])
  });
}
