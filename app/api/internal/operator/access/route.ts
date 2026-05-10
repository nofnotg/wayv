import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext, isInternalRequestAuthorized } from "@/lib/services/internal-auth-service";
import { upsertOperatorAccess } from "@/lib/services/operator-access-service";
import { operatorRoleSeedSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized || !isInternalRequestAuthorized(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = operatorRoleSeedSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-operator-access" }, { status: 400 });
  }

  try {
    const access = await upsertOperatorAccess(parsed.data);
    return NextResponse.json({ access }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "operator-access-seed-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
