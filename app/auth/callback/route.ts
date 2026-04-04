import { NextRequest, NextResponse } from "next/server";

import { exchangeAuthCodeForSession, exchangeTokenHashForSession } from "@/lib/services/auth-service";
import { sanitizeNextPath } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = sanitizeNextPath(searchParams.get("next"));

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(new URL(`/auth/sign-in?error=missing-code`, request.url));
  }

  try {
    if (code) {
      await exchangeAuthCodeForSession(code);
    } else if (tokenHash && type) {
      await exchangeTokenHashForSession({
        tokenHash,
        type
      });
    }

    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "callback-failed";
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
