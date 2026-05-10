import { PageHeader } from "@/components/layout/page-header";
import { FeedbackForm } from "@/features/feedback/feedback-form";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export default async function FeedbackPage() {
  const viewer = await getViewerContext();
  await enforceApprovedViewerPageAccess({ viewer, nextPath: "/feedback" });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="조용히 들려주세요"
        description="헷갈렸던 점, 불편했던 순간, 나가고 싶었던 이유까지 가볍게 남길 수 있어요."
      />
      <FeedbackForm />
    </div>
  );
}
