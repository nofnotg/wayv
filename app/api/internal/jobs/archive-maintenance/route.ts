import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";

export async function POST(request: NextRequest) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    { ok: false, status: "stub", message: "archive maintenance job will be implemented next." },
    { status: 501 }
  );
}
