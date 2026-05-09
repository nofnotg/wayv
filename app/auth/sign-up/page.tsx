import { SectionCard } from "@/components/section-card";
import { SetupBanner } from "@/components/setup-banner";
import { SignUpForm } from "@/features/auth/sign-up-form";

type SignUpPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const errorCopy: Record<string, string> = {
  "missing-env": "Supabase 연결값을 먼저 확인해 주세요.",
  "invalid-sign-up": "이메일과 비밀번호를 다시 확인해 주세요. 비밀번호는 8자 이상이어야 합니다.",
  "sign-up-failed": "회원가입을 완료하지 못했어요. 이미 가입된 이메일인지 확인해 주세요."
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/beta/apply";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="grid gap-6">
      <SetupBanner />
      <SectionCard className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white/92 p-8">
        <div className="mb-7 text-center">
          <h1 className="font-serif text-3xl tracking-tight text-[#18251f]">회원가입</h1>
          <p className="mt-2 text-sm leading-6 text-[#657267]">
            먼저 계정을 만들고, 베타 신청 후 승인되면 wayv를 사용할 수 있어요.
          </p>
        </div>
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorCopy[error] ?? error}
          </p>
        ) : null}
        <SignUpForm nextPath={nextPath} />
      </SectionCard>
    </div>
  );
}
