import { NextRequest, NextResponse } from "next/server";

import { createWavePostEntry } from "@/lib/services/posts-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function POST(request: NextRequest) {
  const viewer = await getViewerContext();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const result = await createWavePostEntry(body, viewer.userId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
