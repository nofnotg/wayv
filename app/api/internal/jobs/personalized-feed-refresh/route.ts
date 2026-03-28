import { NextRequest, NextResponse } from "next/server";

import { getCronSecret } from "@/lib/supabase/env";

function isAuthorized(request: NextRequest) {
  const secret = getCronSecret();
  return secret ? request.headers.get("x-cron-secret") === secret : false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    { ok: false, status: "stub", message: "personalized feed refresh job will be implemented next." },
    { status: 501 }
  );
}
