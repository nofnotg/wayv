import { NextResponse } from "next/server";

import { getWavePostById } from "@/lib/services/posts-service";

type PostRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: PostRouteProps) {
  const { id } = await params;
  const post = await getWavePostById(id);

  if (!post) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}
