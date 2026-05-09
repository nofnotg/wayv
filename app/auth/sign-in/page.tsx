import { SectionCard } from "@/components/section-card";
import { SetupBanner } from "@/components/setup-banner";
import { MagicLinkSessionComplete } from "@/features/auth/magic-link-session-complete";
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
      <SectionCard className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white/92 p-8">
        <div className="sr-only">
          <h1>{systemCopy.auth.title}</h1>
          <p>{systemCopy.auth.description}</p>
        </div>
        <MagicLinkSessionComplete nextPath={nextPath} />
        {status === "check-email" ? (
          <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            {systemCopy.auth.sent}
          </p>
        ) : null}
        {status === "signup-pending" ? (
          <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            회원가입이 접수됐습니다. 운영자 승인 후 wayv를 사용할 수 있어요.
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
