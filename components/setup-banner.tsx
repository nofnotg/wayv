import Link from "next/link";

import { hasSupabaseEnv } from "@/lib/supabase/env";

export function SetupBanner() {
  if (hasSupabaseEnv()) {
    return null;
  }

  return (
    <div className="mb-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p className="font-medium">Supabase 연결값이 아직 비어 있어요.</p>
      <p className="mt-1">
        <code className="rounded bg-white/80 px-1 py-0.5">.env.local</code>에{" "}
        <code className="rounded bg-white/80 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
        <code className="rounded bg-white/80 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,{" "}
        <code className="rounded bg-white/80 px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>를
        채우면 실제 인증과 데이터 흐름을 바로 확인할 수 있어요.
      </p>
      <p className="mt-2">
        자세한 안내는{" "}
        <Link href="https://supabase.com/docs/guides/getting-started" className="underline">
          Supabase 공식 문서
        </Link>
        와 README에 정리해 둘게요.
      </p>
    </div>
  );
}
