import { cn } from "@/lib/utils";

type StatusChipProps = {
  label: string;
  tone?: "default" | "quiet" | "active";
};

export function StatusChip({ label, tone = "default" }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        tone === "active" && "bg-cyan-100 text-cyan-900",
        tone === "quiet" && "bg-slate-100 text-slate-700",
        tone === "default" && "bg-amber-100 text-amber-900"
      )}
    >
      {label}
    </span>
  );
}
