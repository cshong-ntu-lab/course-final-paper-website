import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "font-mono text-2xs uppercase tracking-[0.08em] text-subtle mb-1.5 block",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
