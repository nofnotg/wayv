import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "wayv",
    mode: "web-with-mobile-ready-contracts"
  });
}
