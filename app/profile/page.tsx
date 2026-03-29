import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { ProfileForm } from "@/features/profile/profile-form";
import { systemCopy } from "@/lib/copy/system-copy";
import { getViewerContext } from "@/lib/services/viewer-service";

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const viewer = await getViewerContext();
  if (!viewer) {
    redirect("/auth/sign-in?next=/profile");
  }

  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="grid gap-6">
      <PageHeader title={systemCopy.profile.title} description={systemCopy.profile.description} />
      <SectionCard>
        {status === "saved" ? (
          <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            {systemCopy.profile.saved}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {systemCopy.profile.error}
          </p>
        ) : null}
        <ProfileForm profile={viewer.profile} />
      </SectionCard>
    </div>
  );
}
