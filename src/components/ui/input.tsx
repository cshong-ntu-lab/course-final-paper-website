// Hand-rolled per design.md §2.1 (Input).
import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-9 w-full rounded border bg-surface border-border-strong px-3 py-2 text-sm font-sans",
        "placeholder:text-subtle",
        "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-soft",
        "disabled:bg-canvas disabled:text-muted disabled:cursor-not-allowed",
        "aria-invalid:border-destructive aria-invalid:ring-destructive-soft",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
