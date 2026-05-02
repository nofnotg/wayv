import { PageHeader } from "@/components/layout/page-header";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { systemCopy } from "@/lib/copy/system-copy";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getQuestionCatalogForViewer } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type OnboardingPageProps = {
  searchParams?: Promise<{
    next?: string;
    preview?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const viewer = await getViewerContext();
  const params = searchParams ? await searchParams : {};
  const approvedViewer = await enforceApprovedViewerPageAccess({
    viewer,
    nextPath: "/onboarding",
    requireOnboarding: false
  });
  const previewMode = Boolean(approvedViewer.operatorAccess && params.preview === "operator");
  const questions = await getQuestionCatalogForViewer(
    `${approvedViewer.userId}:${previewMode ? "operator-preview" : "required"}`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_20%_0%,rgba(131,160,141,0.24),transparent_35%),linear-gradient(180deg,#fbf6eb_0%,#edf3ee_100%)] px-5 py-8">
      <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center">
        <PageHeader
          title={previewMode ? "운영자 온보딩 미리보기" : systemCopy.onboarding.title}
          description={
            previewMode
              ? "저장 없이 실제 질문 흐름만 검수합니다. 사용자가 보는 속도와 온도를 확인해 주세요."
              : systemCopy.onboarding.subtitle
          }
        />
        <OnboardingForm
          initialQuestions={questions}
          nextPath={params.next ?? "/"}
          previewMode={previewMode}
        />
      </main>
    </div>
  );
}
