"use client";

import { useMemo, useState, useTransition } from "react";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import type {
  OnboardingQuestionBranch,
  OnboardingQuestionOptionRecord,
  OnboardingQuestionPhrasing,
  OnboardingQuestionSource,
  OnboardingQuestionSourceBundle
} from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils";

type OnboardingSourcePanelProps = {
  initialSources: OnboardingQuestionSourceBundle[];
};

async function sendJson<T>(url: string, body: unknown, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-operator-label": "operator-onboarding-admin"
    },
    body: JSON.stringify(body)
  });
  const data = (await response.json().catch(() => null)) as T | null;
  if (!response.ok || !data) {
    throw new Error("operator-onboarding-request-failed");
  }
  return data;
}

export function OnboardingSourcePanel({ initialSources }: OnboardingSourcePanelProps) {
  const [sources, setSources] = useState(initialSources);
  const [selectedKey, setSelectedKey] = useState(initialSources[0]?.source.key ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [newSourceKey, setNewSourceKey] = useState("");
  const [newSourceLabel, setNewSourceLabel] = useState("");
  const [newPhrasing, setNewPhrasing] = useState("");
  const [newOptionKey, setNewOptionKey] = useState("");
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newBranchDependsOn, setNewBranchDependsOn] = useState("");
  const [newBranchAnyOf, setNewBranchAnyOf] = useState("");

  const selected = useMemo(
    () => sources.find((bundle) => bundle.source.key === selectedKey) ?? sources[0] ?? null,
    [selectedKey, sources]
  );

  const replaceSource = (source: OnboardingQuestionSource) => {
    setSources((current) =>
      current.map((bundle) =>
        bundle.source.key === source.key ? { ...bundle, source } : bundle
      )
    );
  };

  const addToSelected = (
    patch: Partial<Pick<OnboardingQuestionSourceBundle, "phrasings" | "options" | "branches">>
  ) => {
    if (!selected) {
      return;
    }

    setSources((current) =>
      current.map((bundle) =>
        bundle.source.key === selected.source.key
          ? {
              ...bundle,
              phrasings: patch.phrasings ?? bundle.phrasings,
              options: patch.options ?? bundle.options,
              branches: patch.branches ?? bundle.branches
            }
          : bundle
      )
    );
  };

  const toggleSource = () => {
    if (!selected) {
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const payload = {
        ...selected.source,
        psychologicalBasis: selected.source.psychologicalBasis,
        profileTargets: selected.source.profileTargets,
        maxSelect: selected.source.maxSelect,
        orderIndex: selected.source.orderIndex,
        isRequired: selected.source.isRequired,
        isClarifier: selected.source.isClarifier,
        isActive: !selected.source.isActive,
        operatorNote: selected.source.operatorNote
      };
      const data = await sendJson<{ source: OnboardingQuestionSource }>(
        `/api/internal/onboarding/sources/${selected.source.key}`,
        payload,
        "PATCH"
      );
      replaceSource(data.source);
      setMessage("질문 원천 상태를 저장했어요.");
    });
  };

  const createSource = () => {
    startTransition(async () => {
      setMessage(null);
      const data = await sendJson<{ source: OnboardingQuestionSource }>(
        "/api/internal/onboarding/sources",
        {
          key: newSourceKey,
          label: newSourceLabel,
          intent: "운영자가 새로 추가한 원론적 질문 원천입니다.",
          psychologicalBasis:
            "진단이 아니라 deterministic preference profiling을 위한 운영자 관리 원천입니다.",
          type: "single_choice",
          profileTargets: [],
          maxSelect: 1,
          orderIndex: 90,
          isRequired: false,
          isClarifier: true,
          isActive: false,
          operatorNote: "새 원천은 검수 후 활성화해 주세요."
        }
      );
      setSources((current) => [
        ...current,
        { source: data.source, phrasings: [], options: [], branches: [] }
      ]);
      setSelectedKey(data.source.key);
      setNewSourceKey("");
      setNewSourceLabel("");
      setMessage("새 질문 원천을 비활성 상태로 만들었어요.");
    });
  };

  const createPhrasing = () => {
    if (!selected) {
      return;
    }

    startTransition(async () => {
      const data = await sendJson<{ phrasing: OnboardingQuestionPhrasing }>(
        "/api/internal/onboarding/phrasings",
        {
          sourceKey: selected.source.key,
          text: newPhrasing,
          subtitle: null,
          isPrimary: selected.phrasings.length === 0,
          isActive: true
        }
      );
      addToSelected({ phrasings: [...selected.phrasings, data.phrasing] });
      setNewPhrasing("");
      setMessage("표현 변형을 추가했어요.");
    });
  };

  const createOption = () => {
    if (!selected) {
      return;
    }

    startTransition(async () => {
      const data = await sendJson<{ option: OnboardingQuestionOptionRecord }>(
        "/api/internal/onboarding/options",
        {
          sourceKey: selected.source.key,
          optionKey: newOptionKey,
          label: newOptionLabel,
          seedPatch: {},
          orderIndex: selected.options.length * 10 + 10,
          isActive: false
        }
      );
      addToSelected({ options: [...selected.options, data.option] });
      setNewOptionKey("");
      setNewOptionLabel("");
      setMessage("선택지를 비활성 상태로 추가했어요.");
    });
  };

  const createBranch = () => {
    if (!selected) {
      return;
    }

    startTransition(async () => {
      const data = await sendJson<{ branch: OnboardingQuestionBranch }>(
        "/api/internal/onboarding/branches",
        {
          sourceKey: selected.source.key,
          dependsOnSourceKey: newBranchDependsOn,
          anyOf: newBranchAnyOf
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          orderIndex: selected.branches.length * 10 + 10,
          isActive: false
        }
      );
      addToSelected({ branches: [...selected.branches, data.branch] });
      setNewBranchDependsOn("");
      setNewBranchAnyOf("");
      setMessage("분기 규칙을 비활성 상태로 추가했어요.");
    });
  };

  return (
    <SectionCard
      title="온보딩 원천 관리"
      description="사용자에게 보이는 문장만이 아니라, 질문의 의도와 선택지가 어떤 프로필 seed로 이어지는지 함께 검수합니다."
    >
      {message ? (
        <p className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <div className="grid gap-3">
          {sources.map((bundle) => (
            <button
              key={bundle.source.key}
              type="button"
              onClick={() => setSelectedKey(bundle.source.key)}
              className={`rounded-[1.5rem] border px-5 py-4 text-left ${
                selected?.source.key === bundle.source.key
                  ? "border-[#17241f] bg-[#fffaf0]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip label={bundle.source.isActive ? "active" : "inactive"} tone="quiet" />
                <span className="text-sm font-medium text-slate-900">{bundle.source.label}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{bundle.source.key}</p>
            </button>
          ))}

          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
            <p className="text-sm font-medium text-slate-900">새 원천 추가</p>
            <input
              value={newSourceKey}
              onChange={(event) => setNewSourceKey(event.target.value)}
              placeholder="source_key"
              className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={newSourceLabel}
              onChange={(event) => setNewSourceLabel(event.target.value)}
              placeholder="원천 이름"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={pending || !newSourceKey || !newSourceLabel}
              onClick={createSource}
              className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:text-slate-400"
            >
              비활성 원천 만들기
            </button>
          </div>
        </div>

        {selected ? (
          <div className="grid gap-4">
            <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip label={selected.source.type} tone="quiet" />
                <StatusChip
                  label={selected.source.isClarifier ? "clarifier" : "base"}
                  tone="quiet"
                />
                <StatusChip
                  label={selected.source.isRequired ? "required" : "optional"}
                  tone="quiet"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={toggleSource}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:text-slate-400"
                >
                  {selected.source.isActive ? "비활성화" : "활성화"}
                </button>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-950">{selected.source.label}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">{selected.source.intent}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {selected.source.psychologicalBasis}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                targets {selected.source.profileTargets.join(", ") || "none"} / updated{" "}
                {formatDateTime(selected.source.updatedAt)}
              </p>
            </article>

            <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-950">표현 변형</h3>
              <div className="mt-3 grid gap-2">
                {selected.phrasings.map((phrasing) => (
                  <p key={phrasing.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    {phrasing.isPrimary ? "대표 · " : ""}
                    {phrasing.text}
                  </p>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={newPhrasing}
                  onChange={(event) => setNewPhrasing(event.target.value)}
                  placeholder="새 표현 문장"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={pending || !newPhrasing}
                  onClick={createPhrasing}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:text-slate-400"
                >
                  추가
                </button>
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-950">선택지와 profile mapping</h3>
              <div className="mt-3 grid gap-2">
                {selected.options.map((option) => (
                  <div key={option.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-900">{option.label}</span>
                    <span className="ml-2 text-xs text-slate-500">{option.optionKey}</span>
                    <pre className="mt-2 overflow-auto text-xs text-slate-500">
                      {JSON.stringify(option.seedPatch)}
                    </pre>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[0.5fr_1fr_auto]">
                <input
                  value={newOptionKey}
                  onChange={(event) => setNewOptionKey(event.target.value)}
                  placeholder="option_key"
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={newOptionLabel}
                  onChange={(event) => setNewOptionLabel(event.target.value)}
                  placeholder="선택지 라벨"
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={pending || !newOptionKey || !newOptionLabel}
                  onClick={createOption}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:text-slate-400"
                >
                  추가
                </button>
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-950">분기 규칙</h3>
              <div className="mt-3 grid gap-2">
                {selected.branches.map((branch) => (
                  <p key={branch.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    {branch.dependsOnSourceKey} in [{branch.anyOf.join(", ")}]
                  </p>
                ))}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[0.8fr_1fr_auto]">
                <input
                  value={newBranchDependsOn}
                  onChange={(event) => setNewBranchDependsOn(event.target.value)}
                  placeholder="depends_on_source"
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={newBranchAnyOf}
                  onChange={(event) => setNewBranchAnyOf(event.target.value)}
                  placeholder="any_of: quiet,light"
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={pending || !newBranchDependsOn || !newBranchAnyOf}
                  onClick={createBranch}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:text-slate-400"
                >
                  추가
                </button>
              </div>
            </article>
          </div>
        ) : (
          <p className="text-sm text-slate-600">아직 등록된 온보딩 원천이 없어요.</p>
        )}
      </div>
    </SectionCard>
  );
}
