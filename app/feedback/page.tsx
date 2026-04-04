import { PageHeader } from "@/components/layout/page-header";
import { FeedbackForm } from "@/features/feedback/feedback-form";

export default function FeedbackPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="조용히 알려주세요"
        description="헷갈렸던 점, 불편했던 순간, 나가고 싶었던 이유까지 가볍게 남길 수 있어요."
      />
      <FeedbackForm />
    </div>
  );
}
