import { PageHeader } from "@/components/layout/page-header";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { systemCopy } from "@/lib/copy/system-copy";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export default async function OnboardingPage() {
  const viewer = await getViewerContext();
  await enforceApprovedViewerPageAccess({ viewer, nextPath: "/onboarding" });

  return (
    <div className="grid gap-6">
      <PageHeader title={systemCopy.onboarding.title} description={systemCopy.onboarding.subtitle} />
      <OnboardingForm />
    </div>
  );
}
