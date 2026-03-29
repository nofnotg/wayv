import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/services/internal-auth-service";
import { updateCommentModerationStatus } from "@/lib/services/moderation-admin-service";
import { moderationUpdateSchema } from "@/lib/validation/schemas";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const internal = getInternalRequestContext(request);
  if (!internal.authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = moderationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-moderation-status" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const moderation = await updateCommentModerationStatus(
      id,
      parsed.data.status,
      internal.actorLabel
    );
    return NextResponse.json({ moderation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "moderation-update-failed" },
      { status: 400 }
    );
  }
}
