import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { importSeedWavePosts } from "@/lib/services/seed-content-service";

export async function POST(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || !("entries" in payload)) {
    return NextResponse.json({ error: "invalid-seed-import" }, { status: 400 });
  }

  try {
    const result = await importSeedWavePosts(
      (payload as { entries: Parameters<typeof importSeedWavePosts>[0] }).entries
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "seed-import-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

