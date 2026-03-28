import type { RestModeSetting } from "@/lib/domain/types";
import { updateRestModeAction } from "@/lib/services/profile-service";
import { formatDateTime } from "@/lib/utils";

import { SubmitButton } from "@/components/ui/submit-button";

type RestModeFormProps = {
  restMode: RestModeSetting | null;
};

export function RestModeForm({ restMode }: RestModeFormProps) {
  const active = Boolean(restMode?.enabled);

  return (
    <form action={updateRestModeAction} className="grid gap-4">
      <input type="hidden" name="enabled" value={active ? "false" : "true"} />
      {!active ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">쉬는 시간</span>
          <select name="hours" defaultValue="24" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <option value="6">6시간</option>
            <option value="24">24시간</option>
            <option value="72">3일</option>
            <option value="168">7일</option>
          </select>
        </label>
      ) : (
        <p className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          지금은 쉬는 중이에요. 종료 예정 시각: {formatDateTime(restMode?.endsAt ?? null)}
        </p>
      )}
      <SubmitButton pendingLabel="상태를 바꾸는 중이에요...">
        {active ? "다시 파도로 돌아가기" : "해변에서 쉬기"}
      </SubmitButton>
    </form>
  );
}
