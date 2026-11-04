'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { NAV_ITEMS } from './navItems';
import { ThemeSwitcher } from './ThemeSwitcher';
import { SignOutButton } from './SignOutButton';
import { useSidebar } from './DashboardShell';

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-bg-secondary/40 px-4 py-6 backdrop-blur-xl transition-transform duration-300 md:flex',
        collapsed && '-translate-x-full'
      )}
    >
      <Link href="/" className="px-1" aria-label="HeyVanilla home">
        {/* the right-coloured logo shows for the current light/dark mode */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/black.png" alt="HeyVanilla" className="only-light h-16 w-auto" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/white.png" alt="HeyVanilla" className="only-dark h-16 w-auto" />
      </Link>

      <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm transition-all duration-200',
                active
                  ? 'bg-[var(--accent)] text-white shadow-[0_10px_24px_-12px_color-mix(in_srgb,var(--accent)_85%,transparent)]'
                  : 'text-text-secondary hover:bg-white/40 hover:text-text-primary hover:translate-x-0.5'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full bg-white/80" style={{ width: 3 }} />
              )}
              <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <ThemeSwitcher />
        <SignOutButton />
      </div>
    </aside>
  );
}
