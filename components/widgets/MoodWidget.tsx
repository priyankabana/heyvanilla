'use client';

import { Smile } from 'lucide-react';
import { useDashboard, MOODS } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';

// Tiny dependency-free sparkline for the 7-day mood trend.
function Sparkline({ data }: { data: number[] }) {
  const w = 200;
  const h = 36;
  const max = 5;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = v === 0 ? h : h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const hasData = data.some((v) => v > 0);
  return (
    <div className="mt-3">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-text-secondary">
        last 7 days
      </p>
      {hasData ? (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 36 }}>
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <p className="text-xs text-text-secondary">check in to see your trend</p>
      )}
    </div>
  );
}

export function MoodWidget() {
  const { todayMood, pickMood, moodSpark } = useDashboard();
  return (
    <WidgetShell icon={<Smile size={16} />} title="Mood" href="/mood">
      <div className="flex justify-between gap-1">
        {MOODS.map((m) => (
          <button
            key={m.key}
            onClick={() => pickMood(m.key)}
            aria-label={m.label}
            className="flex h-9 w-9 items-center justify-center rounded-full border text-lg transition-all"
            style={{
              borderColor: todayMood?.mood === m.key ? 'var(--accent)' : 'var(--border)',
              backgroundColor: todayMood?.mood === m.key ? 'var(--accent-light)' : 'transparent',
            }}
          >
            {m.emoji}
          </button>
        ))}
      </div>
      <Sparkline data={moodSpark} />
    </WidgetShell>
  );
}
