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
        "rounded-[2.25rem] border border-white/70 bg-[#fffaf0]/78 p-6 shadow-[0_22px_70px_rgba(54,64,54,0.10)] backdrop-blur-xl",
        className
      )}
    >
      {title ? (
        <div className="mb-4">
          <h2 className="font-serif text-2xl tracking-tight text-[#1d2b24]">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-[#667367]">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
