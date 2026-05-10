import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { ProfileForm } from "@/features/profile/profile-form";
import { systemCopy } from "@/lib/copy/system-copy";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const viewer = await getViewerContext();
  const approvedViewer = await enforceApprovedViewerPageAccess({ viewer, nextPath: "/profile" });

  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : null;
  const error = typeof params.error === "string" ? params.error : null;
  const notice = typeof params.notice === "string" ? params.notice : null;

  return (
    <div className="grid gap-6">
      <PageHeader title={systemCopy.profile.title} description={systemCopy.profile.description} />
      <SectionCard>
        {status === "saved" ? (
          <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            {notice === "wave-keeper"
              ? "소개를 저장했어요. 다만 파도지기 기준에서 조금 더 부드럽게 남기면 좋겠다는 안내도 함께 남겨 두었어요."
              : systemCopy.profile.saved}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error === "moderation"
              ? "지금 소개 문구는 잠시 보류되었어요. 개인정보 노출이나 강한 표현이 없는지 한 번만 더 살펴봐 주세요."
              : systemCopy.profile.error}
          </p>
        ) : null}
        <ProfileForm profile={approvedViewer.profile} />
      </SectionCard>
    </div>
  );
}
