'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'ghost' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'text-white shadow-[0_10px_24px_-12px_color-mix(in_srgb,var(--accent)_85%,transparent)] hover:-translate-y-0.5 active:translate-y-0 [background:linear-gradient(135deg,var(--accent),var(--accent-dark))]',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
  outline:
    'bg-transparent border border-border text-text-primary hover:bg-bg-secondary',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius)]',
        'px-4 py-2.5 text-sm font-medium transition-all duration-200',
        'min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
