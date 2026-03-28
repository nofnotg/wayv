import { NextResponse } from "next/server";

import { signOutCurrentSession } from "@/lib/services/auth-service";

export async function POST() {
  try {
    await signOutCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "signout-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
