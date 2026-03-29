import type { Route } from "next";
import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { systemCopy } from "@/lib/copy/system-copy";

export function SettingsLinks() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SectionCard
        title={systemCopy.settings.notificationsTitle}
        description={systemCopy.settings.notificationsDescription}
      >
        <Link
          href="/settings/notifications"
          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        >
          {systemCopy.settings.notificationsCta}
        </Link>
      </SectionCard>
      <SectionCard
        title={systemCopy.settings.restModeTitle}
        description={systemCopy.settings.restModeDescription}
      >
        <Link
          href="/settings/rest-mode"
          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        >
          {systemCopy.settings.restModeCta}
        </Link>
      </SectionCard>
      <SectionCard
        title={systemCopy.settings.inboxTitle}
        description={systemCopy.settings.inboxDescription}
      >
        <Link
          href={"/inbox" as Route}
          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        >
          {systemCopy.settings.inboxCta}
        </Link>
      </SectionCard>
    </div>
  );
}
