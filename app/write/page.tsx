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
            {error === "content-hard-block"
              ? "파도지기가 지금은 이 글을 받을 수 없다고 판단했어요. 연락처 노출이나 강한 공격 표현 없이 다시 남겨 주세요."
              : "본문은 20자 이상으로 남겨 주세요."}
          </p>
        ) : null}
        <WriteForm />
      </SectionCard>
    </div>
  );
}
