import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer";

    const variants = {
      primary:
        "bg-white text-black hover:bg-neutral-200 font-bold tracking-tight shadow-sm",
      secondary:
        "bg-[#1A1A1A] text-white hover:bg-[#252525] border border-white/10 hover:border-white/20",
      outline:
        "bg-transparent text-white/70 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20",
      ghost:
        "bg-transparent text-white/50 hover:text-white hover:bg-white/5",
      danger:
        "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    };

    const sizes = {
      sm: "text-xs px-3.5 py-1.5 rounded-full gap-1.5 h-8",
      md: "text-sm px-5 py-2.5 rounded-full gap-2 h-10 font-semibold",
      lg: "text-sm px-8 py-3 rounded-full gap-2.5 h-12 font-bold tracking-tight",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
