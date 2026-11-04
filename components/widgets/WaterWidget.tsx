'use client';

import { Droplet, Plus, Minus } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';

/** An SVG glass that literally fills as you drink. The water level is a clipped
 *  rect with two gentle sine waves on top for a liquid feel. */
export function WaterWidget() {
  const { todayWater, changeWater } = useDashboard();
  const amount = todayWater?.amount_ml ?? 0;
  const goal = todayWater?.goal_ml ?? 2500;
  const pct = Math.min(100, Math.round((amount / goal) * 100));
  const fillY = 100 - pct; // svg y where the water surface sits (0 = top)

  return (
    <WidgetShell icon={<Droplet size={16} />} title="Water" href="/health">
      <div className="flex h-full flex-col items-center justify-between gap-4 py-1">
        <div className="relative" style={{ width: 78, height: 100 }}>
          <svg viewBox="0 0 60 100" width={78} height={100}>
            <defs>
              <clipPath id="glass-clip">
                <path d="M12 4 L48 4 L43 92 Q42 96 38 96 L22 96 Q18 96 17 92 Z" />
              </clipPath>
              <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-light)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>

            {/* water fill, clipped to the glass shape */}
            <g clipPath="url(#glass-clip)">
              <rect x="0" y="0" width="60" height="100" fill="color-mix(in srgb, var(--accent) 8%, transparent)" />
              <g style={{ transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)', transform: `translateY(${fillY}px)` }}>
                <path
                  d="M-10 4 Q5 0 20 4 T50 4 T80 4 V100 H-10 Z"
                  fill="url(#water-grad)"
                  opacity="0.9"
                >
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="-30 0; 0 0; -30 0"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </path>
              </g>
            </g>

            {/* glass outline */}
            <path
              d="M12 4 L48 4 L43 92 Q42 96 38 96 L22 96 Q18 96 17 92 Z"
              fill="none"
              stroke="var(--border)"
              strokeWidth="2"
            />
          </svg>
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm font-bold text-text-primary mix-blend-luminosity">
            {pct}%
          </span>
        </div>

        <p className="text-xs text-text-secondary">
          {amount} / {goal} ml
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => changeWater(250)}
            className="flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs text-white"
          >
            <Plus size={13} /> 250
          </button>
          <button
            onClick={() => changeWater(-250)}
            aria-label="Remove 250ml"
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary"
          >
            <Minus size={13} />
          </button>
        </div>
      </div>
    </WidgetShell>
  );
}
