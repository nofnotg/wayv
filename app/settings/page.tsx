import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SettingsLinks } from "@/features/settings/settings-links";
import { systemCopy } from "@/lib/copy/system-copy";
import { getViewerContext } from "@/lib/services/viewer-service";

export default async function SettingsPage() {
  const viewer = await getViewerContext();
  if (!viewer) {
    redirect("/auth/sign-in?next=/settings");
  }

  return (
    <div className="grid gap-6">
      <PageHeader title={systemCopy.settings.title} description={systemCopy.settings.description} />
      <SettingsLinks />
    </div>
  );
}
