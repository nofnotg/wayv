import { StatusChip } from "@/components/status-chip";
import { systemCopy } from "@/lib/copy/system-copy";
import type { WavePost } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils";

type WaveDetailProps = {
  post: WavePost;
};

export function WaveDetail({ post }: WaveDetailProps) {
  return (
    <article className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_64px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusChip label={systemCopy.waveStates[post.state]} tone="active" />
        <StatusChip label={post.visibility === "public" ? "공개 파도" : "보관 파도"} />
      </div>
      <h1 className="font-serif text-4xl tracking-tight text-slate-950">
        {post.title ?? "제목 없이 남긴 파도"}
      </h1>
      <p className="mt-3 text-sm text-slate-500">{formatDateTime(post.createdAt)}</p>
      <div className="mt-6 flex flex-wrap gap-2 text-sm text-slate-600">
        {post.categories.map((category) => (
          <span key={category} className="rounded-full bg-slate-100 px-3 py-1">
            {category}
          </span>
        ))}
        {post.emotionTags.map((emotion) => (
          <span key={emotion} className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-900">
            {emotion}
          </span>
        ))}
      </div>
      <div className="mt-8 whitespace-pre-wrap leading-8 text-slate-800">{post.body}</div>
    </article>
  );
}
