import { NextRequest, NextResponse } from "next/server";

import { isInternalRequestAuthorized } from "@/lib/services/internal-auth-service";

export async function POST(request: NextRequest) {
  if (!isInternalRequestAuthorized(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    { ok: false, status: "stub", message: "personalized feed refresh job will be implemented next." },
    { status: 501 }
  );
}
