import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "./utils";

type FieldSize = "md" | "lg";

const fieldHeights: Record<FieldSize, string> = {
  md: "h-10",
  lg: "h-12",
};

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  fieldSize?: FieldSize;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, fieldSize = "md", ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-bg-elevated px-3 text-sm text-text outline-none transition-colors focus:border-accent",
        fieldHeights[fieldSize],
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
