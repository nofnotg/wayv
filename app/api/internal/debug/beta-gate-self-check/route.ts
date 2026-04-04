import { NextRequest, NextResponse } from "next/server";

import { getBetaDeploymentSelfCheck } from "@/lib/services/beta-deployment-self-check-service";
import { getInternalRequestContext } from "@/lib/services/internal-auth-service";

export async function GET(request: NextRequest) {
  const internal = await getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const selfCheck = await getBetaDeploymentSelfCheck({
    requestUrl: request.url,
    viewerUserId: internal.viewerUserId ?? null
  });

  return NextResponse.json({
    selfCheck
  });
}
