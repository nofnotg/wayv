import Link from "next/link";

import { SectionCard } from "@/components/section-card";

export function SettingsLinks() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title="알림 톤 조절" description="묶음 방식과 조용한 시간대를 고를 수 있어요.">
        <Link
          href="/settings/notifications"
          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        >
          알림 설정 열기
        </Link>
      </SectionCard>
      <SectionCard title="해변에서 쉬기" description="추천과 알림을 잠시 잔잔하게 둘 수 있어요.">
        <Link
          href="/settings/rest-mode"
          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        >
          휴식 모드 열기
        </Link>
      </SectionCard>
    </div>
  );
}
