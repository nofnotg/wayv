import Link from "next/link";

import { SetupBanner } from "@/components/setup-banner";
import { SignInForm } from "@/features/auth/sign-in-form";

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const errorCopy: Record<string, string> = {
  "missing-env": "Supabase 연결값을 먼저 확인해 주세요.",
  "invalid-password-login": "이메일과 비밀번호를 다시 확인해 주세요.",
  "password-login-failed": "로그인할 수 없어요. 이메일 또는 비밀번호를 확인해 주세요.",
  "invalid-social-provider": "지원하지 않는 소셜 로그인입니다.",
  "social-login-unavailable": "소셜 로그인을 시작할 수 없어요. 공급자 설정을 확인해 주세요.",
  "magic-link-disabled": "이메일 링크 로그인은 현재 사용하지 않습니다."
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/";
  const status = typeof params.status === "string" ? params.status : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="wayv-auth-overlay">
      <SetupBanner />
      <div className="flex min-h-full items-center justify-center">
        <section className="wayv-auth-card">
          <Link
            href="/?intro=skip"
            aria-label="로그인 닫기"
            className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#9d9283] transition hover:bg-[#ebe1d0] hover:text-[#5a4f44]"
          >
            ×
          </Link>

          <div className="mb-7 text-center">
            <p className="font-serif text-3xl font-light tracking-[0.18em] text-[#2e2620]">
              wayv
            </p>
            <p className="mt-2 font-serif text-sm italic tracking-[0.08em] text-[#8a7d6c]">
              a quiet resonance
            </p>
          </div>

          {status === "signup-pending" ? (
            <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
              회원가입이 접수되었습니다. 운영자 승인 후 wayv를 사용할 수 있어요.
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorCopy[error] ?? error}
            </p>
          ) : null}

          <SignInForm nextPath={nextPath} />
        </section>
      </div>
    </div>
  );
}
