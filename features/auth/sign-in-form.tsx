import { requestSignInLinkAction } from "@/lib/services/auth-service";

import { SubmitButton } from "@/components/ui/submit-button";

type SignInFormProps = {
  nextPath: string;
};

export function SignInForm({ nextPath }: SignInFormProps) {
  return (
    <form action={requestSignInLinkAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">이메일</span>
        <input
          type="email"
          name="email"
          required
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-400"
          placeholder="you@example.com"
        />
      </label>
      <SubmitButton pendingLabel="링크를 보내는 중이에요...">로그인 링크 보내기</SubmitButton>
    </form>
  );
}
