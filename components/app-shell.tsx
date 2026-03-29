import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/lib/services/auth-service";
import { systemCopy } from "@/lib/copy/system-copy";
import type { ViewerContext } from "@/lib/services/viewer-service";

type AppShellProps = {
  children: ReactNode;
  viewer: ViewerContext | null;
};

export function AppShell({ children, viewer }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(157,233,255,0.22),_transparent_40%),linear-gradient(180deg,_#f8fbff_0%,_#f7f3ea_45%,_#eef5f7_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 md:px-10">
        <header className="mb-10 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="font-serif text-3xl tracking-tight text-slate-900">
              {systemCopy.brand.name}
            </Link>
            <p className="mt-1 text-sm text-slate-600">{systemCopy.brand.tagline}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <Link href="/" className="rounded-full px-3 py-2 transition hover:bg-slate-900/5">
              {systemCopy.navigation.home}
            </Link>
            {viewer ? (
              <>
                <Link
                  href="/write"
                  className="rounded-full px-3 py-2 transition hover:bg-slate-900/5"
                >
                  {systemCopy.navigation.write}
                </Link>
                <Link
                  href={"/inbox" as Route}
                  className="rounded-full px-3 py-2 transition hover:bg-slate-900/5"
                >
                  {systemCopy.navigation.inbox}
                </Link>
                <Link
                  href="/profile"
                  className="rounded-full px-3 py-2 transition hover:bg-slate-900/5"
                >
                  {systemCopy.navigation.profile}
                </Link>
                <Link
                  href="/settings"
                  className="rounded-full px-3 py-2 transition hover:bg-slate-900/5"
                >
                  {systemCopy.navigation.settings}
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-slate-300 hover:bg-white"
                  >
                    {systemCopy.navigation.signOut}
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/auth/sign-in"
                className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
              >
                {systemCopy.navigation.signIn}
              </Link>
            )}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
