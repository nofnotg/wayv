import Link from "next/link";
import type { Route } from "next";

import {
  passwordSignInAction,
  socialSignInAction
} from "@/lib/services/auth-service";

import { SubmitButton } from "@/components/ui/submit-button";

type SignInFormProps = {
  nextPath: string;
};

function GoogleLogo() {
  return (
    <svg aria-hidden="true" className="mr-2 h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function SignInForm({ nextPath }: SignInFormProps) {
  return (
    <div className="mx-auto grid w-full max-w-[340px] gap-6">
      <form action={passwordSignInAction} className="grid gap-5">
        <input type="hidden" name="next" value={nextPath} />
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#171717]">아이디</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="h-11 rounded-md border border-[#d8d8d8] bg-white px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#a5abb3] focus:border-[#1f1f1f] focus:ring-2 focus:ring-[#1f1f1f]/10"
            placeholder="이메일 아이디를 입력해 주세요"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#171717]">비밀번호</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="h-11 rounded-md border border-[#d8d8d8] bg-white px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#a5abb3] focus:border-[#1f1f1f] focus:ring-2 focus:ring-[#1f1f1f]/10"
            placeholder="비밀번호를 입력해 주세요"
          />
        </label>

        <a
          href="mailto:nofnotg@gmail.com"
          className="w-fit text-sm font-semibold text-[#171717] underline-offset-4 hover:underline"
        >
          비밀번호 찾기 문의
        </a>

        <SubmitButton
          pendingLabel="로그인 중..."
          className="mt-4 h-11 w-full rounded-md !bg-[#1f1f1f] text-[15px] font-bold !text-white hover:!bg-[#111111]"
        >
          로그인
        </SubmitButton>
      </form>

      <div className="flex items-center gap-3 text-xs text-[#9aa0a6]">
        <div className="h-px flex-1 bg-[#dddddd]" />
        <span>or</span>
        <div className="h-px flex-1 bg-[#dddddd]" />
      </div>

      <div className="grid gap-3">
        <form action={socialSignInAction}>
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="provider" value="google" />
          <SubmitButton
            pendingLabel="Google 로그인 중..."
            className="h-11 w-full rounded-md border border-[#dddddd] !bg-white text-[15px] font-semibold !text-[#1f1f1f] hover:!bg-[#f7f7f7]"
          >
            <GoogleLogo />
            구글 계정으로 로그인
          </SubmitButton>
        </form>

        <form action={socialSignInAction}>
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="provider" value="kakao" />
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#fee500] px-5 text-[15px] font-bold text-[#191600] transition hover:bg-[#f7dc00]"
          >
            <span aria-hidden="true" className="mr-2 text-lg leading-none">
              ●
            </span>
            카카오 계정으로 로그인
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-[#8b8b8b]">
        계정이 없으시다면?{" "}
        <Link
          href={`/auth/sign-up?next=${encodeURIComponent(nextPath || "/beta/apply")}` as Route}
          className="font-bold text-[#171717] hover:underline"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
