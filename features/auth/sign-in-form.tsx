import {
  requestSignInLinkAction,
  socialSignInAction
} from "@/lib/services/auth-service";

import { SubmitButton } from "@/components/ui/submit-button";

type SignInFormProps = {
  nextPath: string;
};

export function SignInForm({ nextPath }: SignInFormProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <form action={socialSignInAction}>
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="provider" value="google" />
          <SubmitButton pendingLabel="Google로 들어가는 중이에요...">
            Google로 계속하기
          </SubmitButton>
        </form>
        <form action={socialSignInAction}>
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="provider" value="kakao" />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full border border-[#e5c444] bg-[#fee500] px-5 py-3 text-sm font-medium text-[#191600] transition hover:bg-[#f7dc00]"
          >
            Kakao로 계속하기
          </button>
        </form>
        <p className="text-xs leading-5 text-[#7c8478]">
          소셜 로그인은 계정을 확인하는 문이에요. 베타 승인은 기존처럼 따로 확인됩니다.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[#ded5c6]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#fffaf0] px-3 text-xs text-[#8a8275]">또는 이메일 링크</span>
        </div>
      </div>

      <form action={requestSignInLinkAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#4f5c53]">이메일</span>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-2xl border border-[#ddd4c3] bg-white/85 px-4 py-3 text-sm text-[#22302b] outline-none ring-0 transition placeholder:text-[#9a988d] focus:border-[#9e8f72]"
            placeholder="you@example.com"
          />
        </label>
        <SubmitButton pendingLabel="로그인 링크를 보내는 중이에요...">
          로그인 링크 보내기
        </SubmitButton>
      </form>
    </div>
  );
}
