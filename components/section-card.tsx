import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: string;
  description?: string;
  className?: string;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  className,
  children
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.07)] backdrop-blur",
        className
      )}
    >
      {title ? (
        <div className="mb-4">
          <h2 className="font-serif text-2xl text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
