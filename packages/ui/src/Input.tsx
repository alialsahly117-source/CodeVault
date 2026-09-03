import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "./utils";

type FieldSize = "md" | "lg";

const fieldHeights: Record<FieldSize, string> = {
  md: "h-10",
  lg: "h-12",
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visual height — "lg" is used where forms benefit from a roomier hit target (e.g. the admin dashboard). */
  fieldSize?: FieldSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, fieldSize = "md", ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-bg-elevated px-3 text-sm text-text placeholder:text-text-muted outline-none transition-colors focus:border-accent",
        fieldHeights[fieldSize],
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none transition-colors focus:border-accent",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-text", className)}>{children}</label>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}
