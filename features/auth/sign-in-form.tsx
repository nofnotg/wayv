import {
  operatorPasswordSignInAction,
  requestSignInLinkAction
} from "@/lib/services/auth-service";

import { SubmitButton } from "@/components/ui/submit-button";

type SignInFormProps = {
  nextPath: string;
};

export function SignInForm({ nextPath }: SignInFormProps) {
  return (
    <div className="grid gap-6">
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

      <div className="rounded-[1.75rem] border border-[#e3d8c4] bg-[#fff7e8]/70 p-4">
        <p className="text-sm font-medium text-[#27372f]">운영자 바로 로그인</p>
        <p className="mt-1 text-xs leading-5 text-[#6d746a]">
          운영 권한이 있는 계정만 사용할 수 있어요. 일반 사용자는 위 이메일 링크로 들어옵니다.
        </p>
        <form action={operatorPasswordSignInAction} className="mt-4 grid gap-3">
          <input type="hidden" name="next" value={nextPath} />
          <label className="block space-y-2">
            <span className="text-xs font-medium text-[#5f675f]">운영자 이메일</span>
            <input
              type="email"
              name="operatorEmail"
              defaultValue="nofnotg@gmail.com"
              required
              className="w-full rounded-2xl border border-[#ddd4c3] bg-white/85 px-4 py-3 text-sm text-[#22302b] outline-none ring-0 transition focus:border-[#9e8f72]"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-medium text-[#5f675f]">비밀번호</span>
            <input
              type="password"
              name="operatorPassword"
              required
              className="w-full rounded-2xl border border-[#ddd4c3] bg-white/85 px-4 py-3 text-sm text-[#22302b] outline-none ring-0 transition focus:border-[#9e8f72]"
            />
          </label>
          <SubmitButton pendingLabel="운영 권한을 확인하는 중이에요...">
            운영자로 들어가기
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
