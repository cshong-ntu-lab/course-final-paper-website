import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

// Variants sourced from tasks/design.md §2.1 (Button).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground hover:bg-accent-hover border border-accent",
        secondary: "bg-surface text-foreground border border-border-strong hover:bg-canvas",
        ghost: "bg-transparent text-muted hover:bg-canvas hover:text-foreground",
        link: "text-accent underline underline-offset-[3px] decoration-accent/40 hover:decoration-accent",
        destructive:
          "bg-surface text-destructive border border-destructive/50 hover:bg-destructive-soft",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded",
        default: "h-9 px-4 text-sm rounded",
        lg: "h-10 px-5 text-sm rounded",
        icon: "h-9 w-9 p-0 rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
