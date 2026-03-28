const requiredPublicKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const;

export function hasSupabaseEnv(): boolean {
  return requiredPublicKeys.every((key) => Boolean(process.env[key]));
}

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return { url, anonKey };
}

export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return key;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getAuthCallbackUrl(): string {
  return process.env.SUPABASE_REDIRECT_URL ?? new URL("/auth/callback", getAppUrl()).toString();
}

export function getMobileAuthRedirects(): string[] {
  return (process.env.MOBILE_AUTH_REDIRECTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isAllowedMobileAuthRedirect(value: string): boolean {
  return getMobileAuthRedirects().includes(value);
}

export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function getCronSecret(): string | null {
  return process.env.CRON_SECRET ?? null;
}
