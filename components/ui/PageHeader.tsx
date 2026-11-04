import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex items-end justify-between gap-4">
      <div className="relative">
        {/* a short accent rule sets a quiet editorial tone above the title */}
        <span
          className="mb-2 block h-[3px] w-9 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 40%, var(--accent-light)))',
          }}
          aria-hidden
        />
        <h1
          className="text-2xl text-text-primary sm:text-3xl"
          style={{ fontFamily: 'var(--font-playfair), serif', fontWeight: 500 }}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
