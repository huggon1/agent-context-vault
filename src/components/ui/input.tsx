import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-border/70 bg-card/50 px-3.5 py-1 text-sm shadow-sm backdrop-blur transition-all",
        "supports-[backdrop-filter]:bg-card/40",
        "placeholder:text-muted-foreground/70",
        "hover:border-border focus-visible:border-primary/60 focus-visible:bg-card/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
