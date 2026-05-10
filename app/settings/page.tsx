import { PageHeader } from "@/components/layout/page-header";
import { SettingsLinks } from "@/features/settings/settings-links";
import { systemCopy } from "@/lib/copy/system-copy";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export default async function SettingsPage() {
  const viewer = await getViewerContext();
  await enforceApprovedViewerPageAccess({ viewer, nextPath: "/settings" });

  return (
    <div className="grid gap-6">
      <PageHeader title={systemCopy.settings.title} description={systemCopy.settings.description} />
      <SettingsLinks />
    </div>
  );
}
