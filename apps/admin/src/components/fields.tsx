import { forwardRef, type ComponentProps } from "react";
import { Input as BaseInput, Select as BaseSelect } from "@codevault/ui";

// The admin dashboard uses taller form fields than the public site by
// default — these wrap the shared UI primitives with fieldSize="lg" so every
// admin page gets that without repeating the prop at each call site.
export const Input = forwardRef<HTMLInputElement, ComponentProps<typeof BaseInput>>((props, ref) => (
  <BaseInput ref={ref} fieldSize="lg" {...props} />
));
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, ComponentProps<typeof BaseSelect>>((props, ref) => (
  <BaseSelect ref={ref} fieldSize="lg" {...props} />
));
Select.displayName = "Select";
