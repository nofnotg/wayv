import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicSupabaseEnv, getServiceRoleKey } from "@/lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getPublicSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot mutate cookies after streaming starts.
        }
      }
    }
  });
}

export function createAdminSupabaseClient() {
  const { url } = getPublicSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();

  return createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        return;
      }
    }
  });
}
