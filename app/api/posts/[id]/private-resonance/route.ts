import { NextRequest, NextResponse } from "next/server";

import { buildApprovedViewerApiGuard } from "@/lib/services/beta-access-guard-service";
import {
  clearPrivateResonanceTrace,
  getPrivateResonanceTrace,
  upsertPrivateResonanceTrace
} from "@/lib/services/private-resonance-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type PrivateResonanceRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: PrivateResonanceRouteProps) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }

  const { id } = await params;

  try {
    const trace = await getPrivateResonanceTrace(id, viewer!.userId);
    return NextResponse.json({ trace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "private-resonance-read-failed";
    const status = message === "not-found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: PrivateResonanceRouteProps) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const trace = await upsertPrivateResonanceTrace(body, id, viewer!.userId);
    return NextResponse.json({ trace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "private-resonance-save-failed";
    const status = message === "not-found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_: NextRequest, { params }: PrivateResonanceRouteProps) {
  const viewer = await getViewerContext();
  const guard = buildApprovedViewerApiGuard(viewer);
  if (guard) {
    return guard;
  }

  const { id } = await params;

  try {
    await clearPrivateResonanceTrace(id, viewer!.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "private-resonance-clear-failed";
    const status = message === "not-found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
