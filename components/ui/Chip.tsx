'use client';

import { cn } from '@/lib/utils/cn';

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
        active
          ? 'bg-[var(--accent)] text-white'
          : 'border border-border bg-white/30 text-text-secondary hover:text-text-primary'
      )}
    >
      {children}
    </button>
  );
}
