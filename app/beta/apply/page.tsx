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
        title="\ubca0\ud0c0 \uc2e0\uccad"
        description="\uba3c\uc800 wayv\ub97c \uc5b4\ub5bb\uac8c \uc4f0\uace0 \uc2f6\uc740\uc9c0 \ub0a8\uaca8 \uc8fc\uc138\uc694. \uc2b9\uc778 \uc804\uae4c\uc9c0\ub294 \ub300\uae30 \ud654\uba74\ub9cc \ubcf4\uc774\uace0, \uc2b9\uc778 \ud6c4\uc5d0 \uc628\ubcf4\ub529\uacfc \ud53c\ub4dc\uac00 \uc5f4\ub824\uc694."
      />

      {viewer?.betaAccess ? <BetaAccessStateCard access={viewer.betaAccess} /> : null}

      <SectionCard
        title={
          viewer?.betaAccess
            ? "\uc2e0\uccad \uba54\ubaa8 \ub2e4\uc2dc \ub0a8\uae30\uae30"
            : "\uc2e0\uccad \uba54\ubaa8 \ub0a8\uae30\uae30"
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
            {
              "\uc774\ubbf8 \uacc4\uc815\uc774 \uc788\ub2e4\uba74 \ub85c\uadf8\uc778 \ud6c4 \uc2e0\uccad \uc774\ub825\uc744 \uad00\ub9ac\ud558\ub294 \uac83\ub3c4 \uac00\ub2a5\ud574\uc694. \ub85c\uadf8\uc778 \uc0c1\ud0dc\uc5d0\uc11c\ub294 \uc2e0\uccad \ub0b4\uc5ed\uacfc \ud604\uc7ac \uc0c1\ud0dc\ub97c \uacc4\uc18d \ud655\uc778\ud560 \uc218 \uc788\uc5b4\uc694."
            }
          </p>
          <Link
            href="/auth/sign-in?next=/beta/apply"
            className="mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            {"\ub85c\uadf8\uc778\ud558\uace0 \uc2e0\uccad \uc774\uc5b4\uac00\uae30"}
          </Link>
        </SectionCard>
      ) : null}
    </div>
  );
}
