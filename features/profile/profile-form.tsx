import type { UserProfile } from "@/lib/domain/types";
import { systemCopy } from "@/lib/copy/system-copy";
import { updateProfileAction } from "@/lib/services/profile-service";

import { SubmitButton } from "@/components/ui/submit-button";

type ProfileFormProps = {
  profile: UserProfile;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  return (
    <form action={updateProfileAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">닉네임</span>
        <input
          name="nickname"
          defaultValue={profile.nickname}
          required
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">표시 이름</span>
        <input
          name="displayName"
          defaultValue={profile.displayName ?? ""}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">소개</span>
        <textarea
          name="bio"
          defaultValue={profile.bio ?? ""}
          rows={4}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">공개 범위</span>
        <select
          name="profileVisibility"
          defaultValue={profile.profileVisibility}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="anonymous">완전 익명</option>
          <option value="semi_anonymous">반익명</option>
          <option value="nickname_visible">닉네임 공개</option>
          <option value="profile_visible">프로필 공개</option>
        </select>
      </label>
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <input type="checkbox" name="notificationOptIn" defaultChecked={profile.notificationOptIn} />
        <span>가끔 조용한 알림을 받아 볼게요.</span>
      </label>
      <SubmitButton pendingLabel="프로필을 저장하는 중이에요...">
        {systemCopy.profile.submit}
      </SubmitButton>
    </form>
  );
}
