import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "primary" | "success" | "warning" | "outline";
  size?: "sm" | "md";
  className?: string;
  children?: React.ReactNode;
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-full uppercase tracking-wider transition-colors";

  const variants = {
    neutral: "bg-white/5 text-white/70 border border-white/10",
    primary: "bg-white text-black font-semibold border border-white",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    outline: "bg-transparent text-white/50 border border-white/10",
  };

  const sizes = {
    sm: "text-[9px] px-2 py-0.5 gap-1 font-mono",
    md: "text-[10px] px-2.5 py-0.5 gap-1.5 font-medium",
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
