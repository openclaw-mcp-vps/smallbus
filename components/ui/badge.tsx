import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "bg-[#1f2937] text-[#c9d1d9]",
      success: "bg-[#0f5323] text-[#3fb950]",
      warning: "bg-[#5d3a00] text-[#d29922]",
      danger: "bg-[#5a1f1f] text-[#f85149]"
    }
  },
  defaultVariants: {
    variant: "neutral"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
