import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leftIcon, rightElement, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-[11px] uppercase tracking-widest text-white/60 font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-white/40 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full bg-[#111111] text-white placeholder:text-white/30 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:border-white/30 focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed",
              leftIcon && "pl-10",
              rightElement && "pr-11",
              error && "border-red-500/80 focus:border-red-500",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 flex items-center">{rightElement}</div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-400 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-white/40 leading-relaxed">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="text-[11px] uppercase tracking-widest text-white/60 font-medium">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "w-full bg-[#111111] text-white placeholder:text-white/30 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:border-white/30 focus:ring-0 resize-none min-h-[88px] disabled:opacity-40 disabled:cursor-not-allowed",
            error && "border-red-500/80 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-400 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-white/40 leading-relaxed">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
