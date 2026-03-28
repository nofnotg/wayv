import { NextRequest, NextResponse } from "next/server";

import { exchangeAuthCodeForSession } from "@/lib/services/auth-service";
import { sanitizeNextPath } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(`/auth/sign-in?error=missing-code`, request.url));
  }

  try {
    await exchangeAuthCodeForSession(code);
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "callback-failed";
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
