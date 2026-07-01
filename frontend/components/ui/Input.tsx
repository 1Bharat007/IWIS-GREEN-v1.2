import React, { useId } from "react";
import { AlertIcon, CheckCircleIcon } from "@/components/ui/Icons";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  endIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  success,
  endIcon,
  id: externalId,
  className = "",
  ...props
}: InputProps) {
  const generatedId = useId();
  const id = externalId || generatedId;
  const errorId = `${id}-error`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full px-3 py-3 rounded-lg border bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200
            ${error 
              ? "border-[var(--destructive)] focus:ring-2 focus:ring-[var(--destructive)]/15" 
              : success
                ? "border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            }
            ${endIcon ? "pr-10" : ""}
          `}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] flex items-center justify-center">
            {endIcon}
          </div>
        )}
      </div>
      {error && (
        <div id={errorId} className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--destructive)] animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertIcon size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
