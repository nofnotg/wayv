"use client";

import { useEffect, useState } from "react";

import { createClientSupabaseClient } from "@/lib/supabase/client";

type MagicLinkSessionCompleteProps = {
  nextPath: string;
};

export function MagicLinkSessionComplete({ nextPath }: MagicLinkSessionCompleteProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;

    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return;
    }

    const supabase = createClientSupabaseClient();

    void supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setError("로그인 링크를 다시 확인해 주세요.");
          return;
        }

        window.location.replace(nextPath);
      });
  }, [nextPath]);

  if (!error) {
    return null;
  }

  return (
    <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {error}
    </p>
  );
}
