import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { SetupBanner } from "@/components/setup-banner";
import { SignInForm } from "@/features/auth/sign-in-form";
import { systemCopy } from "@/lib/copy/system-copy";

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/";
  const status = typeof params.status === "string" ? params.status : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="grid gap-6">
      <SetupBanner />
      <SectionCard className="mx-auto w-full max-w-xl p-8">
        <PageHeader title={systemCopy.auth.title} description={systemCopy.auth.description} />
        {status === "check-email" ? (
          <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            {systemCopy.auth.sent}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <SignInForm nextPath={nextPath} />
      </SectionCard>
    </div>
  );
}
