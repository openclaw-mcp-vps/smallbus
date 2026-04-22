import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#c9d1d9] placeholder:text-[#6e7681] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
