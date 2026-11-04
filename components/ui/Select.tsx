'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, options, id, className, ...props }, ref) => {
    const sid = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={sid} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={sid}
          className={cn(
            'min-h-[44px] rounded-[var(--radius)] border border-border bg-white/40 px-3 py-2.5',
            'text-sm text-text-primary outline-none transition-all duration-200',
            'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20',
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
