import Link from "next/link";
import type { Route } from "next";

import { passwordSignUpAction } from "@/lib/services/auth-service";

import { SubmitButton } from "@/components/ui/submit-button";

type SignUpFormProps = {
  nextPath: string;
};

export function SignUpForm({ nextPath }: SignUpFormProps) {
  return (
    <form action={passwordSignUpAction} className="mx-auto grid w-full max-w-[340px] gap-5">
      <input type="hidden" name="next" value={nextPath || "/beta/apply"} />
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
          minLength={8}
          autoComplete="new-password"
          className="h-11 rounded-md border border-[#d8d8d8] bg-white px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#a5abb3] focus:border-[#1f1f1f] focus:ring-2 focus:ring-[#1f1f1f]/10"
          placeholder="8자 이상 입력해 주세요"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#171717]">비밀번호 확인</span>
        <input
          type="password"
          name="passwordConfirm"
          required
          minLength={8}
          autoComplete="new-password"
          className="h-11 rounded-md border border-[#d8d8d8] bg-white px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#a5abb3] focus:border-[#1f1f1f] focus:ring-2 focus:ring-[#1f1f1f]/10"
          placeholder="비밀번호를 한 번 더 입력해 주세요"
        />
      </label>

      <SubmitButton
        pendingLabel="회원가입 중..."
        className="mt-4 h-11 w-full rounded-md !bg-[#1f1f1f] text-[15px] font-bold !text-white hover:!bg-[#111111]"
      >
        회원가입
      </SubmitButton>

      <p className="text-center text-sm text-[#8b8b8b]">
        이미 계정이 있으시다면?{" "}
        <Link
          href={`/auth/sign-in?next=${encodeURIComponent(nextPath || "/beta/apply")}` as Route}
          className="font-bold text-[#171717] hover:underline"
        >
          로그인
        </Link>
      </p>

      <p className="rounded-2xl border border-[#e4ded4] bg-[#fffaf0]/70 p-4 text-xs leading-6 text-[#6f756d]">
        회원가입은 계정 생성만 담당합니다. 실제 제품 사용은 기존처럼 베타 신청 후 운영자
        승인 상태에서 열립니다.
      </p>
    </form>
  );
}
