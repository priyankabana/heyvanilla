'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/** The standard frame every dashboard widget renders inside: a glass card with
 *  a small header (icon + title + optional action and/or jump link). Drag/hide
 *  affordances live in the sortable wrapper, so widgets stay free of layout
 *  concerns.
 *
 *  - `action`: an inline control (e.g. a quick-add +) shown in the header.
 *  - `href`: shows a jump arrow that opens the full feature page. */
export function WidgetShell({
  icon,
  title,
  href,
  action,
  children,
  className,
  bodyClassName,
}: {
  icon: ReactNode;
  title: string;
  href?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn('glass-card card-hover flex h-full flex-col p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2.5 text-sm font-medium text-text-primary">
          <span className="icon-chip">{icon}</span>
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {action}
          {href && (
            <Link
              href={href}
              aria-label={`Open ${title}`}
              className="text-text-secondary transition-colors hover:text-[var(--accent)]"
            >
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
      <div className={cn('mt-3 flex-1', bodyClassName)}>{children}</div>
    </div>
  );
}
