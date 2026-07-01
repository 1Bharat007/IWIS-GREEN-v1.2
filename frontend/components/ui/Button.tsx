import React from "react";
import { CheckIcon } from "@/components/ui/Icons";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  loading?: boolean;
  success?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  loading = false,
  success = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = "relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] min-h-[48px]";
  
  const variants = {
    primary: "bg-[var(--text-primary)] text-[var(--bg)] hover:opacity-90 focus:ring-[var(--text-primary)]",
    secondary: "bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] focus:ring-[var(--border)]",
    outline: "border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-primary)] focus:ring-[var(--text-primary)]",
    ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] focus:ring-[var(--border)]",
  };

  const isActuallyDisabled = disabled || loading || success;

  return (
    <button
      {...props}
      disabled={isActuallyDisabled}
      aria-disabled={isActuallyDisabled}
      aria-busy={loading}
      className={`${baseClasses} ${variants[variant]} ${success ? "!bg-[var(--accent)] !text-white !border-transparent" : ""} ${className}`}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      )}
      {success && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl animate-in fade-in zoom-in duration-300">
          <CheckIcon size={20} className="text-white" />
        </span>
      )}
      <span className={`flex items-center gap-2 transition-opacity duration-200 ${loading || success ? "opacity-0" : "opacity-100"}`}>
        {children}
      </span>
    </button>
  );
}
