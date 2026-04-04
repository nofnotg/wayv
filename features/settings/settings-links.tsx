import type { Route } from "next";
import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { systemCopy } from "@/lib/copy/system-copy";

export function SettingsLinks() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
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
      <SectionCard
        title="베타 피드백"
        description="헷갈린 순간이나 나가고 싶었던 이유를 조용히 남길 수 있어요."
      >
        <Link
          href={"/feedback" as Route}
          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        >
          의견 남기기
        </Link>
      </SectionCard>
    </div>
  );
}
