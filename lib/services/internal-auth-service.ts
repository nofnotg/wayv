import { getCronSecret, hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { getOperatorAccess } from "@/lib/services/operator-access-service";

type RequestLike = {
  headers: Headers;
};

export type InternalRequestContext = {
  authorized: boolean;
  actorLabel: string;
};

export function isInternalAccessTokenValid(token: string | null | undefined) {
  const secret = getCronSecret();
  return Boolean(secret && token && token === secret);
}

export function getInternalActorLabel(label: string | null | undefined) {
  const fallback = "internal-token";
  const value = label?.trim();
  if (!value) {
    return fallback;
  }

  return value.replace(/[^\w\-./:@ ]/g, "").slice(0, 64) || fallback;
}

export function isInternalRequestAuthorized(request: RequestLike) {
  return isInternalAccessTokenValid(request.headers.get("x-cron-secret"));
}

function buildOperatorActorLabel(input: {
  email?: string | null;
  role: "operator" | "admin";
  requestedLabel?: string | null;
}) {
  if (input.requestedLabel) {
    const email = input.email?.trim();
    return getInternalActorLabel(
      email ? `${input.requestedLabel}:${email}` : input.requestedLabel
    );
  }

  const prefix = input.role === "admin" ? "admin" : "operator";
  const email = input.email?.trim();
  if (!email) {
    return `${prefix}:unknown`;
  }

  return getInternalActorLabel(`${prefix}:${email}`);
}

async function getOperatorRequestContext(request: RequestLike) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  const access = await getOperatorAccess(user.id);
  if (!access) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: access.role,
    actorLabel: buildOperatorActorLabel({
      email: user.email,
      role: access.role,
      requestedLabel: request.headers.get("x-operator-label")
    })
  };
}

export async function getInternalRequestContext(
  request: RequestLike
): Promise<InternalRequestContext> {
  if (isInternalRequestAuthorized(request)) {
    return {
      authorized: true,
      actorLabel: getInternalActorLabel(request.headers.get("x-operator-label"))
    };
  }

  const operator = await getOperatorRequestContext(request);
  if (operator) {
    return {
      authorized: true,
      actorLabel: operator.actorLabel
    };
  }

  return {
    authorized: false,
    actorLabel: getInternalActorLabel(request.headers.get("x-operator-label"))
  };
}
