import type { NotificationPreference } from "@/lib/domain/types";
import { updateNotificationPreferencesAction } from "@/lib/services/profile-service";

import { SubmitButton } from "@/components/ui/submit-button";

type NotificationSettingsFormProps = {
  preferences: NotificationPreference | null;
};

export function NotificationSettingsForm({ preferences }: NotificationSettingsFormProps) {
  return (
    <form action={updateNotificationPreferencesAction} className="grid gap-4">
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <input type="checkbox" name="enabled" defaultChecked={preferences?.enabled ?? true} />
        <span>알림을 잔잔하게 받아 볼게요.</span>
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">알림 묶음 방식</span>
        <select
          name="digestMode"
          defaultValue={preferences?.digestMode ?? "light"}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="off">묶음 없이 둘게요</option>
          <option value="light">가볍게 묶어 주세요</option>
          <option value="normal">보통 정도로 묶어 주세요</option>
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">조용한 시작 시간</span>
          <input
            type="time"
            name="quietHoursStart"
            defaultValue={preferences?.quietHoursStart ?? ""}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">조용한 끝 시간</span>
          <input
            type="time"
            name="quietHoursEnd"
            defaultValue={preferences?.quietHoursEnd ?? ""}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">하루 최대 알림 수</span>
        <input
          type="number"
          min={0}
          max={5}
          name="maxDailyNotifications"
          defaultValue={preferences?.maxDailyNotifications ?? 2}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />
      </label>
      <SubmitButton pendingLabel="알림 설정을 저장하는 중이에요...">
        알림 설정 저장하기
      </SubmitButton>
    </form>
  );
}
