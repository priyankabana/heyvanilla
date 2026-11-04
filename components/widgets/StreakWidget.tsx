'use client';

import { Flame } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';

export function StreakWidget() {
  const { longestStreak } = useDashboard();
  const { days, name } = longestStreak;

  return (
    <WidgetShell icon={<Flame size={16} />} title="Streak" href="/habits">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="relative">
          <span
            className="text-5xl"
            style={{
              filter: days > 0 ? 'drop-shadow(0 0 14px color-mix(in srgb, var(--accent) 60%, transparent))' : 'none',
            }}
          >
            🔥
          </span>
        </div>
        <p className="text-gradient mt-1 text-4xl font-bold">{days}</p>
        <p className="text-xs text-text-secondary">
          {days === 0
            ? 'start a streak today'
            : `day${days === 1 ? '' : 's'}${name ? ` · ${name}` : ''}`}
        </p>
      </div>
    </WidgetShell>
  );
}
