import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// clsx alone just concatenates class strings — when two conflicting utilities
// land in the list (e.g. a base "h-10" plus a caller's "h-11" override),
// which one wins depends on Tailwind's internal stylesheet order, not on
// where they appear in the string. twMerge resolves that deterministically:
// the last conflicting utility always wins, which is what callers expect.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(date)
  );
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
