import type { ReactNode } from "react";
import { cn } from "./utils";

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-bg-elevated px-2 py-0.5 text-xs font-mono text-text-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}
