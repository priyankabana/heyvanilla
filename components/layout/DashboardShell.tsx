'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Topbar } from './Topbar';
import { CommandPalette } from '@/components/CommandPalette';
import { AchievementWatcher } from '@/components/AchievementWatcher';
import { WelcomeOverlay } from '@/components/WelcomeOverlay';
import { NamePrompt } from '@/components/NamePrompt';

const STORE_KEY = 'heyvanilla_sidebar';

interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
}
const Ctx = createContext<SidebarCtx | null>(null);

export function useSidebar(): SidebarCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSidebar must be used inside <DashboardShell>');
  return c;
}

/** Owns the dashboard chrome so the sidebar can be hidden/shown from the top
 *  bar. The preference is remembered in localStorage. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORE_KEY) === '1') setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(STORE_KEY, next ? '1' : '0');
      return next;
    });
  }

  return (
    <Ctx.Provider value={{ collapsed, toggle }}>
      <div
        data-welcome-hide
        className={`min-h-dvh transition-[padding] duration-300 ${
          collapsed ? 'md:pl-0' : 'md:pl-60'
        }`}
      >
        <Sidebar />
        {/* Full-width content so widgets spread across the page (and fill the
            extra room when the sidebar is hidden) instead of a narrow column. */}
        <main className="w-full px-4 pb-28 pt-5 sm:px-6 lg:px-10 md:pb-12 md:pt-8">
          <Topbar />
          {children}
        </main>
        <MobileNav />
        <CommandPalette />
        <AchievementWatcher />
      </div>
      <WelcomeOverlay />
      <NamePrompt />
    </Ctx.Provider>
  );
}
