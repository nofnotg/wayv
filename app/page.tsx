import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BetaAccessStateCard } from "@/components/beta-access-state-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { SetupBanner } from "@/components/setup-banner";
import { StatusChip } from "@/components/status-chip";
import { WaveCard } from "@/features/feed/wave-card";
import { QuietResonanceLanding } from "@/features/landing/quiet-resonance-landing";
import { systemCopy } from "@/lib/copy/system-copy";
import { isApprovedViewer } from "@/lib/services/beta-access-guard-service";
import { buildHomeFeed } from "@/lib/services/feed-service";
import { getStoredSeedProfile } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export default async function HomePage() {
  const viewer = await getViewerContext();
  const canUseProduct = isApprovedViewer(viewer);

  if (!viewer) {
    return (
      <>
        <SetupBanner />
        <QuietResonanceLanding />
      </>
    );
  }

  if (!viewer.betaAccess && !canUseProduct) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title={`\uc548\ub155\ud558\uc138\uc694, ${viewer.profile.nickname}`}
          description="로그인은 완료되었지만 아직 베타 신청은 제출되지 않았어요. 신청을 남기면 검토 후 승인 여부가 안내돼요."
        />
        <SectionCard className="border-cyan-100 bg-cyan-50/80 p-8">
          <h2 className="font-serif text-3xl tracking-tight text-slate-950">
            {"\ubca0\ud0c0 \uc2e0\uccad\uc744 \uba3c\uc800 \ub0a8\uaca8 \uc8fc\uc138\uc694"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
            {
              "\uc2e0\uccad \uc804\uc5d0\ub294 \ud53c\ub4dc, \uae00\uc4f0\uae30, \ub313\uae00, \ub9ac\uc561\uc158, \uc778\ubc15\uc2a4 \uac19\uc740 \ubcf8 \uc81c\ud488 \ud654\uba74\uc744 \uc5f4 \uc218 \uc5c6\uc5b4\uc694. \ubca0\ud0c0 \uc2b9\uc778\uc774 \ub418\uba74 \uc628\ubcf4\ub529\uacfc \ubcf8 \uc0ac\uc6a9 \ud750\ub984\uc774 \uc5f4\ub9bd\ub2c8\ub2e4."
            }
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={"/beta/apply" as Route}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm text-white"
            >
              {"\ubca0\ud0c0 \uc2e0\uccad\ud558\uae30"}
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (!canUseProduct && viewer.betaAccess) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title={`\uc548\ub155\ud558\uc138\uc694, ${viewer.profile.nickname}`}
          description="승인 전까지는 대기 상태 화면에서 신청 결과만 확인할 수 있어요. 승인되면 온보딩과 피드 이용이 열려요."
        />
        <BetaAccessStateCard access={viewer.betaAccess} />
      </div>
    );
  }

  if (!viewer.operatorAccess && !viewer.profile.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const seedProfile = await getStoredSeedProfile(viewer.userId);
  const feed = await buildHomeFeed({
    viewerId: viewer.userId,
    seedProfile,
    restMode: viewer.restMode
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`\uc548\ub155\ud558\uc138\uc694, ${viewer.profile.nickname}`}
        description="오늘 남아 있는 파도들을 조용히 펼쳐두었어요. 빠르게 판단하지 않고, 먼저 어디에 시선이 머무는지만 보아도 괜찮아요."
      />

      {viewer.restMode?.enabled ? (
        <SectionCard className="border-[#c8ddd2] bg-[#edf7f1]/82">
          <p className="text-sm font-medium text-[#23473b]">{systemCopy.home.restModeBanner}</p>
          <p className="mt-2 text-sm leading-7 text-[#3f675b]">{systemCopy.home.restModeDescription}</p>
        </SectionCard>
      ) : null}

      <SectionCard
        title={systemCopy.home.weatherTitle}
        description={systemCopy.home.weatherDescription}
      >
        <div className="grid gap-3">
          {feed.weather.map((weather) => (
            <div
              key={`${weather.topic}-${weather.state}`}
              className="rounded-[1.75rem] border border-[#e4dccd] bg-[#f8f2e8]/72 px-5 py-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <StatusChip label={systemCopy.waveStates[weather.state]} tone="active" />
                <span className="text-sm text-[#7a7569]">{weather.topic}</span>
              </div>
              <p className="text-sm leading-7 text-[#536156]">{weather.copy}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={systemCopy.home.forYouTitle}
        description={systemCopy.home.forYouDescription}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {feed.lanes.for_you.length ? (
            feed.lanes.for_you.map((post) => <WaveCard key={post.id} post={post} />)
          ) : feed.meta.forYouSuppressed ? (
            <div className="rounded-[1.75rem] border border-[#c8ddd2] bg-[#edf7f1]/82 px-5 py-4 md:col-span-2">
              <p className="text-sm font-medium text-[#23473b]">
                {systemCopy.home.forYouRestingTitle}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#3f675b]">
                {systemCopy.home.forYouRestingDescription}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#657267]">{systemCopy.home.emptyForYou}</p>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title={systemCopy.home.quietTitle}
          description={systemCopy.home.quietDescription}
        >
          <div className="grid gap-4">
            {feed.lanes.quiet.length ? (
              feed.lanes.quiet.map((post) => <WaveCard key={post.id} post={post} />)
            ) : (
              <p className="text-sm text-[#657267]">{systemCopy.home.emptyQuiet}</p>
            )}
          </div>
        </SectionCard>
        <SectionCard
          title={systemCopy.home.rekindledTitle}
          description={systemCopy.home.rekindledDescription}
        >
          <div className="grid gap-4">
            {feed.lanes.rekindled.length ? (
              feed.lanes.rekindled.map((post) => <WaveCard key={post.id} post={post} />)
            ) : (
              <p className="text-sm text-[#657267]">{systemCopy.home.emptyRekindled}</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
