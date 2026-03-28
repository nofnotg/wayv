import { getCronSecret } from "@/lib/supabase/env";

type RequestLike = {
  headers: Headers;
};

export function isInternalRequestAuthorized(request: RequestLike) {
  const secret = getCronSecret();
  return secret ? request.headers.get("x-cron-secret") === secret : false;
}
