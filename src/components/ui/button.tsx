import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm border text-xs font-semibold tracking-[0.16em] uppercase transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald",
  {
    variants: {
      variant: {
        solid: "border-emerald-deep bg-emerald-deep text-white hover:bg-emerald",
        outline: "border-white/75 bg-transparent text-white hover:border-white",
        quiet: "border-line bg-card text-foreground hover:border-emerald",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-white/5",
      },
      size: {
        md: "min-h-11 px-5 py-3",
        sm: "min-h-9 px-3 py-2 tracking-[0.12em]",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
