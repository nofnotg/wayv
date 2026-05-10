import { NextRequest, NextResponse } from "next/server";

import { updateBetaAccessRequestStatus } from "@/lib/services/beta-access-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { betaAccessDecisionSchema } from "@/lib/validation/schemas";

type BetaAccessDecisionRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: BetaAccessDecisionRouteProps) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = betaAccessDecisionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-beta-access-decision" }, { status: 400 });
  }

  try {
    const { id } = await params;
    const result = await updateBetaAccessRequestStatus({
      requestId: id,
      status: parsed.data.status,
      note: parsed.data.note ?? null,
      actorUserId: internal.viewerUserId ?? null,
      actorLabel: internal.actorLabel
    });

    return NextResponse.json({ access: result.request });
  } catch (error) {
    const message = error instanceof Error ? error.message : "beta-access-decision-failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
