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
              {systemCopy.home.startLink}
            </Link>
            <StatusChip label={systemCopy.home.statusChips.resonance} tone="quiet" />
            <StatusChip label={systemCopy.home.statusChips.restMode} tone="quiet" />
            <StatusChip label={systemCopy.home.statusChips.mobileReady} tone="quiet" />
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
            {systemCopy.home.onboardingCardDescription}
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm text-white"
          >
            {systemCopy.home.onboardingCta}
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
        description="오늘의 흐름과 나에게 닿는 파도를 조용히 살펴보고 있어요."
      />

      {viewer.restMode?.enabled ? (
        <SectionCard className="border-cyan-100 bg-cyan-50/80">
          <p className="text-sm font-medium text-cyan-950">{systemCopy.home.restModeBanner}</p>
          <p className="mt-2 text-sm text-cyan-900">{systemCopy.home.restModeDescription}</p>
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

      <SectionCard
        title={systemCopy.home.forYouTitle}
        description={systemCopy.home.forYouDescription}
      >
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
            <p className="text-sm text-slate-600">{systemCopy.home.emptyForYou}</p>
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
              <p className="text-sm text-slate-600">{systemCopy.home.emptyQuiet}</p>
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
              <p className="text-sm text-slate-600">{systemCopy.home.emptyRekindled}</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
