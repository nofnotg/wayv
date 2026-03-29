import { getCronSecret } from "@/lib/supabase/env";

type RequestLike = {
  headers: Headers;
};

export type InternalRequestContext = {
  authorized: boolean;
  actorLabel: string;
};

/**
 * Internal tooling currently shares a single secret with cron-style jobs.
 * This keeps the surface minimal for MVP, but it does not provide per-operator
 * identity, granular authorization, or audit attribution yet.
 */
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

export function getInternalRequestContext(request: RequestLike): InternalRequestContext {
  return {
    authorized: isInternalRequestAuthorized(request),
    actorLabel: getInternalActorLabel(request.headers.get("x-operator-label"))
  };
}
