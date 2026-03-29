import Link from "next/link";

import { StatusChip } from "@/components/status-chip";
import { systemCopy } from "@/lib/copy/system-copy";
import type { WavePost } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils";

type WaveCardProps = {
  post: WavePost;
};

export function WaveCard({ post }: WaveCardProps) {
  return (
    <Link
      href={`/wave/${post.id}`}
      className="block rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusChip label={systemCopy.waveStates[post.state]} tone="quiet" />
        {post.categories.map((category) => (
          <span
            key={category}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
          >
            {category}
          </span>
        ))}
      </div>
      <h3 className="font-serif text-2xl text-slate-950">
        {post.title ?? systemCopy.wave.untitled}
      </h3>
      <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-700">{post.body}</p>
      <p className="mt-4 text-xs text-slate-500">{formatDateTime(post.createdAt)}</p>
    </Link>
  );
}
