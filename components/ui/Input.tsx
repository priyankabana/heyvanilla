'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-text-secondary"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            'min-h-[44px] rounded-[var(--radius)] border border-border bg-white/40 px-3.5 py-2.5',
            'text-sm text-text-primary placeholder:text-text-secondary/60',
            'transition-all duration-200 outline-none',
            'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20',
            error && 'border-[var(--danger)] focus:ring-[var(--danger)]/20',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-[var(--danger)]" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
