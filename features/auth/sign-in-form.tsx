import Link from "next/link";

import {
  passwordSignInAction,
  requestSignInLinkAction,
  socialSignInAction
} from "@/lib/services/auth-service";

import { SubmitButton } from "@/components/ui/submit-button";

type SignInFormProps = {
  nextPath: string;
};

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
          href="#email-link-login"
          className="w-fit text-sm font-semibold text-[#171717] underline-offset-4 hover:underline"
        >
          비밀번호 찾기
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
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-base font-bold text-[#4285f4]">
              G
            </span>
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
        <Link href="/beta/apply" className="font-bold text-[#171717] hover:underline">
          회원가입
        </Link>
      </p>

      <form id="email-link-login" action={requestSignInLinkAction} className="grid gap-3 rounded-2xl border border-[#e4ded4] bg-[#fffaf0]/70 p-4">
        <input type="hidden" name="next" value={nextPath} />
        <p className="text-xs leading-5 text-[#6f756d]">
          비밀번호가 기억나지 않으면 이메일 링크로 들어올 수 있어요.
        </p>
        <label className="sr-only" htmlFor="magic-email">
          이메일 링크 받을 주소
        </label>
        <input
          id="magic-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          className="h-10 rounded-md border border-[#d8d8d8] bg-white px-3 text-sm text-[#171717] outline-none placeholder:text-[#a5abb3]"
          placeholder="이메일 주소"
        />
        <SubmitButton
          pendingLabel="링크 보내는 중..."
          className="h-10 w-full rounded-md !bg-[#eef0ec] text-sm font-semibold !text-[#1f1f1f] hover:!bg-[#e1e5df]"
        >
          이메일 링크 받기
        </SubmitButton>
      </form>
    </div>
  );
}
