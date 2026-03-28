import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { NotificationSettingsForm } from "@/features/settings/notification-settings-form";
import { getViewerContext } from "@/lib/services/viewer-service";

type NotificationSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NotificationSettingsPage({
  searchParams
}: NotificationSettingsPageProps) {
  const viewer = await getViewerContext();
  if (!viewer) {
    redirect("/auth/sign-in?next=/settings/notifications");
  }

  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="알림 톤 조절"
        description="웹과 모바일에서 같은 기준으로 알림의 강도와 빈도를 관리할 수 있어요."
      />
      <SectionCard>
        {status === "saved" ? (
          <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            알림 설정을 저장했어요.
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            알림 설정을 다시 확인해 주세요.
          </p>
        ) : null}
        <NotificationSettingsForm preferences={viewer.notificationPreferences} />
      </SectionCard>
    </div>
  );
}
