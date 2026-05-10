import Link from "next/link";

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
    <div className="wayv-auth-overlay">
      <SetupBanner />
      <div className="flex min-h-full items-center justify-center">
        <section className="wayv-auth-card">
          <Link
            href="/?intro=skip"
            aria-label="회원가입 닫기"
            className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#9d9283] transition hover:bg-[#ebe1d0] hover:text-[#5a4f44]"
          >
            ×
          </Link>

          <div className="mb-7 text-center">
            <h1 className="font-serif text-3xl tracking-tight text-[#18251f]">회원가입</h1>
            <p className="mt-2 text-sm leading-6 text-[#657267]">
              계정을 만들고 베타 신청을 접수합니다. 사용은 운영자 승인 후 열립니다.
            </p>
          </div>

          {error ? (
            <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorCopy[error] ?? error}
            </p>
          ) : null}

          <SignUpForm nextPath={nextPath} />
        </section>
      </div>
    </div>
  );
}
