'use client';

import Link from 'next/link';
import { Shuffle, Search, PanelLeft, PanelLeftClose, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SyncIndicator } from './SyncIndicator';
import { useSidebar } from './DashboardShell';

function openPalette() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
}

export function Topbar() {
  const { surpriseMe, mode, setMode } = useTheme();
  const { collapsed, toggle } = useSidebar();
  const isDark = mode === 'dark';

  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {/* sidebar hide/show — far left, desktop only */}
        <button
          onClick={toggle}
          aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
          className="hidden rounded-full border border-border bg-white/30 p-2 text-text-secondary transition-colors hover:text-[var(--accent)] md:inline-flex"
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>

        {/* logo — always on mobile, and on desktop whenever the sidebar is hidden */}
        <Link
          href="/"
          aria-label="HeyVanilla home"
          className={collapsed ? 'inline-flex' : 'inline-flex md:hidden'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/black.png" alt="HeyVanilla" className="only-light h-20 w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/white.png" alt="HeyVanilla" className="only-dark h-20 w-auto" />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <SyncIndicator />

        {/* quick light/dark toggle, right here on the home page */}
        <button
          onClick={() => setMode(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Switch to light' : 'Switch to dark'}
          title={isDark ? 'Light mode' : 'Dark mode'}
          className="rounded-full border border-border bg-white/30 p-2 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={openPalette}
          className="flex items-center gap-2 rounded-full border border-border bg-white/30 px-3 py-2 text-xs text-text-secondary transition-colors hover:text-[var(--accent)]"
          aria-label="Open command palette"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-border px-1 text-[10px] sm:inline">⌘K</kbd>
        </button>
        <button
          onClick={surpriseMe}
          title="Surprise me with a theme"
          aria-label="Shuffle theme"
          className="rounded-full border border-border bg-white/30 p-2 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          <Shuffle size={16} />
        </button>
      </div>
    </div>
  );
}
