import { NextRequest, NextResponse } from "next/server";

import { submitBetaApplication } from "@/lib/services/beta-access-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "invalid-beta-application" }, { status: 400 });
  }

  try {
    const viewer = await getViewerContext();
    const result = await submitBetaApplication({
      ...(payload as {
        email: string;
        applicantName?: string | null;
        applicationNote: string;
      }),
      userId: viewer?.userId ?? null
    });

    return NextResponse.json(
      { access: result.request, moderation: result.moderation ?? null },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "beta-application-submit-failed";
    try {
      const parsed = JSON.parse(message) as { error?: string; moderation?: unknown };
      if (parsed.error) {
        return NextResponse.json(parsed, { status: 400 });
      }
    } catch {
      // ignore malformed non-JSON errors
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
