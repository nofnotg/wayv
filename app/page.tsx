import type { Route } from "next";
import Link from "next/link";

import { BetaAccessStateCard } from "@/components/beta-access-state-card";
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
              href={"/beta/apply" as Route}
              className="rounded-full border border-slate-300 px-5 py-3 text-sm text-slate-700"
            >
              {"\ubca0\ud0c0 \uc2e0\uccad"}
            </Link>
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

  if (!viewer.betaAccess) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title={`\uc548\ub155\ud558\uc138\uc694, ${viewer.profile.nickname}`}
          description="\ub85c\uadf8\uc778\uc740 \uc644\ub8cc\ub418\uc5c8\uc9c0\ub9cc \uc544\uc9c1 \ubca0\ud0c0 \uc2e0\uccad\uc740 \uc81c\ucd9c\ub418\uc9c0 \uc54a\uc558\uc5b4\uc694. \uc2e0\uccad\uc744 \ub0a8\uae30\uba74 \uac80\ud1a0 \ud6c4 \uc2b9\uc778 \uc5ec\ubd80\uac00 \uc548\ub0b4\ub3fc\uc694."
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

  if (viewer.betaAccess.status !== "approved") {
    return (
      <div className="grid gap-6">
        <PageHeader
          title={`\uc548\ub155\ud558\uc138\uc694, ${viewer.profile.nickname}`}
          description="\uc2b9\uc778 \uc804\uae4c\uc9c0\ub294 \ub300\uae30 \uc0c1\ud0dc \ud654\uba74\uc5d0\uc11c \uc2e0\uccad \uacb0\uacfc\ub9cc \ud655\uc778\ud560 \uc218 \uc788\uc5b4\uc694. \uc2b9\uc778\ub418\uba74 \uc628\ubcf4\ub529\uacfc \ud53c\ub4dc \uc774\uc6a9\uc774 \uc5f4\ub824\uc694."
        />
        <BetaAccessStateCard access={viewer.betaAccess} />
      </div>
    );
  }

  if (!viewer.profile.onboardingCompletedAt) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title={`\uc548\ub155\ud558\uc138\uc694, ${viewer.profile.nickname}`}
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
        title={`\uc548\ub155\ud558\uc138\uc694, ${viewer.profile.nickname}`}
        description="\uc624\ub298\uc740 \uc5b4\ub5a4 \ud750\ub984\uacfc \uc628\ub3c4\uac00 \uba38\ubb3c\uace0 \uc788\ub294\uc9c0 \uc870\uc6a9\ud788 \uc0b4\ud3b4\ubcf4\uace0 \uc788\uc5b4\uc694."
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
