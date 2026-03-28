import { NextRequest, NextResponse } from "next/server";

import { requestSignInLink } from "@/lib/services/auth-service";

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const result = await requestSignInLink(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "request-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
