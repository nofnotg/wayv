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
      className="group block rounded-[1.75rem] border border-[#e5dccb] bg-[#fffdf7]/86 p-5 shadow-[0_12px_36px_rgba(71,78,63,0.07)] transition duration-300 hover:-translate-y-0.5 hover:border-[#cdbb9b] hover:bg-white hover:shadow-[0_24px_52px_rgba(71,78,63,0.12)]"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusChip label={systemCopy.waveStates[post.state]} tone="quiet" />
        {post.categories.map((category) => (
          <span
            key={category}
            className="rounded-full bg-[#edf1ea] px-3 py-1 text-xs text-[#667367]"
          >
            {category}
          </span>
        ))}
      </div>
      <h3 className="font-serif text-2xl tracking-tight text-[#1d2b24] transition group-hover:text-[#314b3f]">
        {post.title ?? systemCopy.wave.untitled}
      </h3>
      <p className="mt-3 line-clamp-4 text-[15px] leading-7 text-[#4f5c53]">{post.body}</p>
      <p className="mt-5 text-xs text-[#7d887e]">{formatDateTime(post.createdAt)}</p>
    </Link>
  );
}
