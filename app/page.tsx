import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { SetupBanner } from "@/components/setup-banner";
import { StatusChip } from "@/components/status-chip";
import { WaveCard } from "@/features/feed/wave-card";
import { systemCopy } from "@/lib/copy/system-copy";
import { buildHomeFeed, getLoggedOutHomeCopy } from "@/lib/services/feed-service";
import { getStoredSeedProfile } from "@/lib/services/onboarding-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export default async function HomePage() {
  const viewer = await getViewerContext();

  if (!viewer) {
    const copy = getLoggedOutHomeCopy();

    return (
      <div className="grid gap-6">
        <SetupBanner />
        <SectionCard className="p-8">
          <PageHeader title={copy.title} description={copy.description} />
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth/sign-in"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm text-white"
            >
              로그인하고 둘러보기
            </Link>
            <StatusChip label="숫자 없는 공명" tone="quiet" />
            <StatusChip label="휴식 모드 지원" tone="quiet" />
            <StatusChip label="모바일 연동 준비" tone="quiet" />
          </div>
        </SectionCard>
      </div>
    );
  }

  if (!viewer.profile.onboardingCompletedAt) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title={`안녕하세요, ${viewer.profile.nickname}`}
          description={systemCopy.home.onboardingPrompt}
        />
        <SectionCard>
          <p className="text-sm leading-7 text-slate-700">
            몇 가지 짧은 질문으로 지금의 흐름과 닮은 파도를 먼저 맞춰 볼게요.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm text-white"
          >
            온보딩 시작하기
          </Link>
        </SectionCard>
      </div>
    );
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
        title={`안녕하세요, ${viewer.profile.nickname}`}
        description="오늘의 흐름과 나에게 닿는 파도를 잔잔하게 살펴볼 수 있어요."
      />

      {viewer.restMode?.enabled ? (
        <SectionCard className="border-cyan-100 bg-cyan-50/80">
          <p className="text-sm font-medium text-cyan-950">{systemCopy.home.restModeBanner}</p>
          <p className="mt-2 text-sm text-cyan-900">
            쉬는 동안에는 추천과 알림을 더 조용하게 둘게요. 작성과 읽기는 그대로 할 수 있어요.
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title={systemCopy.home.weatherTitle} description="개별 인기 대신 전체 흐름의 상태만 보여 드려요.">
        <div className="grid gap-3">
          {feed.weather.map((weather) => (
            <div
              key={`${weather.topic}-${weather.state}`}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <StatusChip label={systemCopy.waveStates[weather.state]} tone="active" />
                <span className="text-sm text-slate-500">{weather.topic}</span>
              </div>
              <p className="text-sm leading-7 text-slate-700">{weather.copy}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={systemCopy.home.forYouTitle} description="온보딩과 최근 흐름을 바탕으로 먼저 닿는 파도예요.">
        <div className="grid gap-4 md:grid-cols-2">
          {feed.lanes.for_you.length ? (
            feed.lanes.for_you.map((post) => <WaveCard key={post.id} post={post} />)
          ) : feed.meta.forYouSuppressed ? (
            <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50/80 px-5 py-4 md:col-span-2">
              <p className="text-sm font-medium text-cyan-950">
                {systemCopy.home.forYouRestingTitle}
              </p>
              <p className="mt-2 text-sm leading-7 text-cyan-900">
                {systemCopy.home.forYouRestingDescription}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">아직 닿아온 파도가 없어요. 첫 파도를 남겨 보세요.</p>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={systemCopy.home.quietTitle}>
          <div className="grid gap-4">
            {feed.lanes.quiet.length ? (
              feed.lanes.quiet.map((post) => <WaveCard key={post.id} post={post} />)
            ) : (
              <p className="text-sm text-slate-600">지금은 조용히 이어지는 파도가 조금 쉬고 있어요.</p>
            )}
          </div>
        </SectionCard>
        <SectionCard title={systemCopy.home.rekindledTitle}>
          <div className="grid gap-4">
            {feed.lanes.rekindled.length ? (
              feed.lanes.rekindled.map((post) => <WaveCard key={post.id} post={post} />)
            ) : (
              <p className="text-sm text-slate-600">다시 일렁이는 흐름이 생기면 여기에서 만날 수 있어요.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
