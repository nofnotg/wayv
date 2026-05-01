import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/lib/services/auth-service";
import { systemCopy } from "@/lib/copy/system-copy";
import type { NotificationInboxSummary } from "@/lib/domain/types";
import type { ViewerContext } from "@/lib/services/viewer-service";

type AppShellProps = {
  children: ReactNode;
  viewer: ViewerContext | null;
  notificationSummary: NotificationInboxSummary | null;
};

export async function AppShell({ children, viewer, notificationSummary }: AppShellProps) {
  const canUseProduct = Boolean(
    viewer && (viewer.betaAccess?.status === "approved" || viewer.operatorAccess)
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_0%,_rgba(105,132,116,0.18),_transparent_34%),radial-gradient(circle_at_88%_12%,_rgba(218,178,128,0.20),_transparent_30%),linear-gradient(180deg,_#f6f1e8_0%,_#eef3ed_52%,_#e8f0f2_100%)] text-[#22302b]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[linear-gradient(110deg,_rgba(255,255,255,0.45),_transparent_62%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 md:px-10 md:py-7">
        <header className="mb-10 flex flex-col gap-4 rounded-[2.25rem] border border-white/65 bg-[#fffaf0]/72 px-5 py-5 shadow-[0_24px_90px_rgba(54,64,54,0.12)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-7">
          <div>
            <Link href="/" className="font-serif text-3xl tracking-tight text-[#18251f]">
              {systemCopy.brand.name}
            </Link>
            <p className="mt-1 max-w-sm text-sm leading-6 text-[#657267]">{systemCopy.brand.tagline}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm text-[#536156]">
            <Link href="/" className="rounded-full px-3 py-2 transition hover:bg-[#25352d]/7 hover:text-[#1d2b24]">
              {systemCopy.navigation.home}
            </Link>
            {viewer ? (
              <>
                {canUseProduct ? (
                  <>
                    <Link
                      href="/write"
                      className="rounded-full px-3 py-2 transition hover:bg-[#25352d]/7 hover:text-[#1d2b24]"
                    >
                      {systemCopy.navigation.write}
                    </Link>
                    <Link
                      href={"/inbox" as Route}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-[#25352d]/7 hover:text-[#1d2b24]"
                    >
                      {systemCopy.navigation.inbox}
                      {notificationSummary?.hasUnread ? (
                        <span
                          className="rounded-full bg-[#d8efe7] px-2 py-0.5 text-[11px] font-medium text-[#244b3f]"
                          aria-label={`${systemCopy.notifications.inboxSummaryTitle} ${notificationSummary.unreadCount}${systemCopy.notifications.unreadSuffix}`}
                        >
                          {systemCopy.notifications.unreadBadge} {notificationSummary.unreadCount}
                        </span>
                      ) : null}
                    </Link>
                    <Link
                      href={"/traces" as Route}
                      className="rounded-full px-3 py-2 transition hover:bg-[#25352d]/7 hover:text-[#1d2b24]"
                    >
                      {systemCopy.navigation.traces}
                    </Link>
                    <Link
                      href="/profile"
                      className="rounded-full px-3 py-2 transition hover:bg-[#25352d]/7 hover:text-[#1d2b24]"
                    >
                      {systemCopy.navigation.profile}
                    </Link>
                    <Link
                      href="/settings"
                      className="rounded-full px-3 py-2 transition hover:bg-[#25352d]/7 hover:text-[#1d2b24]"
                    >
                      {systemCopy.navigation.settings}
                    </Link>
                    <Link
                      href={"/feedback" as Route}
                      className="rounded-full px-3 py-2 transition hover:bg-[#25352d]/7 hover:text-[#1d2b24]"
                    >
                      {"\ud53c\ub4dc\ubc31"}
                    </Link>
                    {viewer.operatorAccess ? (
                      <Link
                        href={"/internal/operator" as Route}
                        className="rounded-full border border-[#d7c7a8] bg-[#fff4dc]/75 px-3 py-2 text-[#745723] transition hover:border-[#b99652] hover:bg-[#f8e6bd]"
                      >
                        {"\uc6b4\uc601"}
                      </Link>
                    ) : null}
                  </>
                ) : null}
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="rounded-full border border-[#d8d0c1] px-4 py-2 text-[#5c665f] transition hover:border-[#b9ad99] hover:bg-white/70"
                  >
                    {systemCopy.navigation.signOut}
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href={"/beta/apply" as Route}
                  className="rounded-full px-3 py-2 transition hover:bg-[#25352d]/7 hover:text-[#1d2b24]"
                >
                  {"\ubca0\ud0c0 \uc2e0\uccad"}
                </Link>
                <Link
                  href="/auth/sign-in"
                  className="rounded-full bg-[#22352c] px-4 py-2 text-[#fffaf0] shadow-[0_10px_24px_rgba(34,53,44,0.18)] transition hover:bg-[#18271f]"
                >
                  {systemCopy.navigation.signIn}
                </Link>
              </>
            )}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
