import { createWavePostAction } from "@/lib/services/posts-service";

import { SubmitButton } from "@/components/ui/submit-button";

export function WriteForm() {
  return (
    <form action={createWavePostAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">제목</span>
        <input name="title" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">본문</span>
        <textarea
          name="body"
          rows={10}
          required
          minLength={20}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />
      </label>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-slate-700">카테고리</legend>
        <div className="flex flex-wrap gap-3">
          {[
            ["work", "일과 커리어"],
            ["money", "돈과 생활"],
            ["relationships", "관계"],
            ["family", "가족"],
            ["study", "학업과 진로"],
            ["health", "건강"],
            ["daily_life", "일상"]
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              <input type="checkbox" name="categories" value={value} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-slate-700">감정 태그</legend>
        <div className="flex flex-wrap gap-3">
          {[
            ["isolation", "고립감"],
            ["self_blame", "자책감"],
            ["anxiety", "불안감"],
            ["frustration", "답답함"],
            ["grief", "상실감"],
            ["relief", "안도감"],
            ["quiet_hope", "조용한 희망"]
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              <input type="checkbox" name="emotionTags" value={value} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">공개 범위</span>
        <select name="visibility" defaultValue="public" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <option value="public">공개 파도</option>
          <option value="private_archive">나만 보관하기</option>
        </select>
      </label>
      <SubmitButton pendingLabel="파도를 남기는 중이에요...">파도 남기기</SubmitButton>
    </form>
  );
}
