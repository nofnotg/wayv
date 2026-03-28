import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { RestModeForm } from "@/features/settings/rest-mode-form";
import { systemCopy } from "@/lib/copy/system-copy";
import { getViewerContext } from "@/lib/services/viewer-service";

type RestModePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RestModePage({ searchParams }: RestModePageProps) {
  const viewer = await getViewerContext();
  if (!viewer) {
    redirect("/auth/sign-in?next=/settings/rest-mode");
  }

  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="grid gap-6">
      <PageHeader title={systemCopy.restMode.title} description={systemCopy.restMode.description} />
      <SectionCard>
        {status === "saved" ? (
          <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            휴식 상태를 바꿨어요.
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            휴식 모드 설정을 다시 확인해 주세요.
          </p>
        ) : null}
        <RestModeForm restMode={viewer.restMode} />
      </SectionCard>
    </div>
  );
}
