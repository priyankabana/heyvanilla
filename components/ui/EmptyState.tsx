import type { ReactNode } from 'react';

export function EmptyState({
  emoji = '🍦',
  title,
  hint,
  action,
}: {
  emoji?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border px-6 py-14 text-center">
      <span className="text-4xl" aria-hidden>
        {emoji}
      </span>
      <p className="mt-3 text-sm font-medium text-text-primary">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-xs text-text-secondary">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
