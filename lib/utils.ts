import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "아직 기록이 없어요";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDateTimeWithSeconds(value: string | null): string {
  if (!value) {
    return "아직 기록이 없어요";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date(value));
}

export function deriveNickname(email: string): string {
  const localPart = email.split("@")[0] ?? "wave";
  const sanitized = localPart.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "guest";
  return `wave-${sanitized}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
