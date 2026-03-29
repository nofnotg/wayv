import { getCronSecret } from "@/lib/supabase/env";

type RequestLike = {
  headers: Headers;
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

export function isInternalRequestAuthorized(request: RequestLike) {
  return isInternalAccessTokenValid(request.headers.get("x-cron-secret"));
}
