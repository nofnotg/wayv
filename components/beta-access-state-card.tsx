import type { Route } from "next";
import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import type { BetaAccessRequest } from "@/lib/domain/types";

type BetaAccessStateCardProps = {
  access: BetaAccessRequest;
};

function getCopy(access: BetaAccessRequest) {
  switch (access.status) {
    case "approved":
      return {
        title: "\ubca0\ud0c0 \uc0ac\uc6a9\uc774 \uc2b9\uc778\ub418\uc5c8\uc5b4\uc694",
        body: "\uc774\uc81c \uc628\ubcf4\ub529\uc744 \uc9c4\ud589\ud558\uace0 wayv\ub97c \uc0ac\uc6a9\ud560 \uc218 \uc788\uc5b4\uc694.",
        ctaLabel: "\uc628\ubcf4\ub529 \uc2dc\uc791",
        ctaHref: "/onboarding"
      };
    case "rejected":
      return {
        title: "\uc774\ubc88 \ubca0\ud0c0 \ucc38\uc5ec\ub294 \ubcf4\ub958\ub418\uc5c8\uc5b4\uc694",
        body:
          access.reviewNote ??
          "\uc774\ubc88 \ub77c\uc6b4\ub4dc\uc5d0\uc11c\ub294 \ucc38\uc5ec \uc2b9\uc778\uc774 \uc5b4\ub835\uc9c0\ub9cc, \ub2e4\uc2dc \uc2e0\uccad \ub0b4\uc6a9\uc744 \ub0a8\uaca8 \uc8fc\uc2dc\uba74 \ub2e4\uc74c \uac80\ud1a0\uc5d0 \ubc18\uc601\ud560\uac8c\uc694.",
        ctaLabel: "\ub2e4\uc2dc \uc2e0\uccad\ud558\uae30",
        ctaHref: "/beta/apply"
      };
    case "revoked":
      return {
        title: "\ud604\uc7ac \uc811\uadfc\uc774 \uc7a0\uc2dc \uba48\ucdb0 \uc788\uc5b4\uc694",
        body:
          access.reviewNote ??
          "\uc6b4\uc601 \ud655\uc778\uc774 \ub05d\ub0a0 \ub54c\uae4c\uc9c0 \ub300\uae30 \uc0c1\ud0dc\ub85c \uc804\ud658\ub418\uc5c8\uc5b4\uc694. \uad81\uae08\ud55c \uc810\uc774 \uc788\uc73c\uba74 \ub2e4\uc2dc \uc2e0\uccad \uba54\ubaa8\ub97c \ub0a8\uaca8 \uc8fc\uc138\uc694.",
        ctaLabel: "\uc2e0\uccad \uba54\ubaa8 \ub0a8\uae30\uae30",
        ctaHref: "/beta/apply"
      };
    default:
      return {
        title: "\ubca0\ud0c0 \uc2b9\uc778 \ub300\uae30 \uc911\uc774\uc5d0\uc694",
        body:
          access.reviewNote ??
          "\uc2e0\uccad \ub0b4\uc6a9\uc744 \uac80\ud1a0\ud558\uace0 \uc788\uc5b4\uc694. \uc2b9\uc778 \uc804\uae4c\uc9c0\ub294 \uc774 \ub300\uae30 \ud654\uba74\ub9cc \ubcf4\uc774\uace0, \ud53c\ub4dc\uc640 \uae00\uc4f0\uae30 \uac19\uc740 \uae30\ub2a5\uc740 \uc5f4\ub9ac\uc9c0 \uc54a\uc544\uc694.",
        ctaLabel: "\uc2e0\uccad \ub0b4\uc6a9 \ud655\uc778",
        ctaHref: "/beta/apply"
      };
  }
}

export function BetaAccessStateCard({ access }: BetaAccessStateCardProps) {
  const copy = getCopy(access);

  return (
    <SectionCard className="border-cyan-100 bg-cyan-50/80 p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-cyan-900">
          beta {access.status}
        </span>
        <span className="text-xs text-cyan-900">
          {"\uc2e0\uccad \uc774\uba54\uc77c"} {access.email}
        </span>
      </div>
      <h2 className="mt-4 font-serif text-3xl tracking-tight text-slate-950">{copy.title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">{copy.body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={copy.ctaHref as Route}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm text-white"
        >
          {copy.ctaLabel}
        </Link>
      </div>
    </SectionCard>
  );
}
