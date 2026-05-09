import Link from "next/link";

import { BetaAccessStateCard } from "@/components/beta-access-state-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { BetaApplicationForm } from "@/features/beta/beta-application-form";
import { getViewerContext } from "@/lib/services/viewer-service";

export default async function BetaApplyPage() {
  const viewer = await getViewerContext();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="베타 신청"
        description="먼저 wayv를 어떻게 쓰고 싶은지 남겨 주세요. 승인 전까지는 대기 화면만 보이고, 승인 후에 온보딩과 피드가 열려요."
      />

      {viewer?.betaAccess ? <BetaAccessStateCard access={viewer.betaAccess} /> : null}

      <SectionCard
        title={
          viewer?.betaAccess
            ? "신청 메모 다시 남기기"
            : "신청 메모 남기기"
        }
      >
        <BetaApplicationForm
          initialEmail={viewer?.email}
          initialName={viewer?.profile.nickname}
          currentStatus={viewer?.betaAccess?.status ?? null}
        />
      </SectionCard>

      {!viewer ? (
        <SectionCard>
          <p className="text-sm leading-7 text-slate-700">
            이미 계정이 있다면 로그인 후 신청 이력을 관리하는 것도 가능해요. 로그인
            상태에서는 신청 내역과 현재 상태를 계속 확인할 수 있어요.
          </p>
          <Link
            href="/auth/sign-in?next=/beta/apply"
            className="mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            로그인하고 신청 이어가기
          </Link>
        </SectionCard>
      ) : null}
    </div>
  );
}
