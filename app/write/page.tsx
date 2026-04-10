import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { WriteForm } from "@/features/write/write-form";
import { systemCopy } from "@/lib/copy/system-copy";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import { getViewerContext } from "@/lib/services/viewer-service";

type WritePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WritePage({ searchParams }: WritePageProps) {
  const viewer = await getViewerContext();
  await enforceApprovedViewerPageAccess({ viewer, nextPath: "/write" });

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="grid gap-6">
      <PageHeader title={systemCopy.write.title} description={systemCopy.write.description} />
      <SectionCard>
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            본문은 20자 이상으로 남겨 주세요.
          </p>
        ) : null}
        <WriteForm />
      </SectionCard>
    </div>
  );
}
